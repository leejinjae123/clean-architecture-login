import { Test, TestingModule } from '@nestjs/testing';
import { LectureRepository } from '../infra/repository/lecture.repository';
import { Lecture } from '../domain/entity/lecture.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LessThan, Repository, UpdateResult } from 'typeorm';
import { redLock, redisClient } from '../common/redis.config';

jest.mock('../infra/redis.config', () => ({
    redLock: {
      acquire: jest.fn(),
    },
    redisClient: {
      flushall: jest.fn(),
    },
  }));
describe('LectureRepository', () => {
  let lectureRepository: LectureRepository;
  let mockLectureRepo: Partial<Record<keyof Repository<Lecture>, jest.Mock>>;

  beforeEach(async () => {
    mockLectureRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      increment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LectureRepository,
        {
          provide: getRepositoryToken(Lecture),
          useValue: mockLectureRepo,
        },
      ],
    }).compile();

    lectureRepository = module.get<LectureRepository>(LectureRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('findById는 강의를 반환하거나 null을 반환해야 함', async () => {
    const lecture = new Lecture();
    mockLectureRepo.findOne.mockResolvedValue(lecture);

    const result = await lectureRepository.findById(1);
    expect(result).toEqual(lecture);
    expect(mockLectureRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('findAvailableLecturesByDate는 사용 가능한 강의 목록을 반환해야 함', async () => {
    const date = new Date();
    const lectures = [new Lecture(), new Lecture()];
    mockLectureRepo.find.mockResolvedValue(lectures);

    const result = await lectureRepository.findAvailableLecturesByDate(date);
    expect(result).toEqual(lectures);
    expect(mockLectureRepo.find).toHaveBeenCalledWith({
      where: {
        date,
        currentAttendees: LessThan(Lecture['capacity']),
      },
    });
  });

  it('save는 저장된 강의를 반환해야 함', async () => {
    const lecture = new Lecture();
    mockLectureRepo.save.mockResolvedValue(lecture);

    const result = await lectureRepository.save(lecture);
    expect(result).toEqual(lecture);
    expect(mockLectureRepo.save).toHaveBeenCalledWith(lecture);
  });

  it('incrementConcurrency는 증가가 성공적일 때 true를 반환해야 함', async () => {
    const updateResult: UpdateResult = { affected: 1 } as UpdateResult;
    mockLectureRepo.increment.mockResolvedValue(updateResult);

    const result = await lectureRepository.incrementConcurrency(1);
    expect(result).toBe(true);
    expect(mockLectureRepo.increment).toHaveBeenCalledWith(
      { id: 1 },
      'currentAttendees',
      1
    );
  });
describe('강력한 동시성 테스트', () => {
    it('여러 요청이 동시에 들어올 때 정확히 30명만 등록되어야 함', async () => {
      const lecture = new Lecture();
      lecture.id = 1;
      lecture.currentAttendees = 0;
      lecture.capacity = 30;

      mockLectureRepo.findOne.mockResolvedValue(lecture);
      mockLectureRepo.save.mockImplementation((savedLecture: Lecture) => {
        lecture.currentAttendees = savedLecture.currentAttendees;
        return Promise.resolve(savedLecture);
      });

      (redLock.acquire as jest.Mock).mockImplementation(() => ({
        release: jest.fn().mockResolvedValue(true),
      }));

      const promises = Array(50).fill(null).map(() => lectureRepository.incrementConcurrency(1));
      const results = await Promise.all(promises);

      const successCount = results.filter(result => result).length;

      expect(successCount).toBe(30);
      expect(lecture.currentAttendees).toBe(30);
    });
  });

  describe('특강 정보 테스트', () => {
    it('특강 ID, 이름, 강연자 정보가 정확히 반환되어야 함', async () => {
      const lecture = new Lecture();
      lecture.id = 1;
      lecture.name = '테스트 특강';
      lecture.lecturer = '홍길동';

      mockLectureRepo.findOne.mockResolvedValue(lecture);

      const result = await lectureRepository.findById(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('테스트 특강');
      expect(result.lecturer).toBe('홍길동');
    });
  });

  describe('정확히 30명 제한 테스트', () => {
    it('29명일 때는 등록 성공, 30명일 때는 등록 실패해야 함', async () => {
      const lecture = new Lecture();
      lecture.id = 1;
      lecture.capacity = 30;

      mockLectureRepo.findOne.mockImplementation(() => {
        lecture.currentAttendees += 1;
        return Promise.resolve({ ...lecture });
      });

      mockLectureRepo.save.mockImplementation((savedLecture: Lecture) => {
        return Promise.resolve(savedLecture);
      });

      (redLock.acquire as jest.Mock).mockImplementation(() => ({
        release: jest.fn().mockResolvedValue(true),
      }));

      // 29번째 등록 (성공해야 함)
      lecture.currentAttendees = 28;
      let result = await lectureRepository.incrementConcurrency(1);
      expect(result).toBe(true);
      expect(lecture.currentAttendees).toBe(29);

      // 30번째 등록 (성공해야 함)
      result = await lectureRepository.incrementConcurrency(1);
      expect(result).toBe(true);
      expect(lecture.currentAttendees).toBe(30);

      // 31번째 등록 (실패해야 함)
      result = await lectureRepository.incrementConcurrency(1);
      expect(result).toBe(false);
      expect(lecture.currentAttendees).toBe(30);
    });
  });
});