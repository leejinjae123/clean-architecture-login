import { Test, TestingModule } from '@nestjs/testing';
import { LectureRepository } from '../infra/repository/lecture.repository';
import { Lecture } from '../domain/entity/lecture.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LessThan, Repository, UpdateResult } from 'typeorm';
import { redLock, redisClient } from '../common/redis.config';

jest.mock('../common/redis.config', () => ({
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

  // ... 기존 테스트 케이스들 ...

  describe('강력한 동시성 테스트', () => {
    it('여러 요청이 동시에 들어올 때 정확히 30명만 등록되어야 함', async () => {
      const lecture = new Lecture();
      lecture.id = 1;
      lecture.currentAttendees = 0;
      lecture.capacity = 30;

      let callCount = 0;
      mockLectureRepo.findOne.mockImplementation(() => {
        callCount++;
        return Promise.resolve({ ...lecture, currentAttendees: Math.min(callCount - 1, 30) });
      });

      mockLectureRepo.increment.mockImplementation(() => {
        return Promise.resolve({ affected: callCount <= 30 ? 1 : 0 });
      });

      (redLock.acquire as jest.Mock).mockImplementation(() => ({
        release: jest.fn().mockResolvedValue(true),
      }));

      const promises = Array(50).fill(null).map(() => lectureRepository.incrementConcurrency(1));
      const results = await Promise.all(promises);

      const successCount = results.filter(result => result).length;

      expect(successCount).toBe(30);
      expect(callCount).toBe(50);
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

    it('존재하지 않는 특강 ID로 조회 시 null을 반환해야 함', async () => {
      mockLectureRepo.findOne.mockResolvedValue(null);

      const result = await lectureRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('정확히 30명 제한 테스트', () => {
    it('29명일 때는 등록 성공, 30명일 때는 등록 성공, 31명째는 등록 실패해야 함', async () => {
      const lecture = new Lecture();
      lecture.id = 1;
      lecture.capacity = 30;

      let currentAttendees = 28;
      mockLectureRepo.findOne.mockImplementation(() => {
        return Promise.resolve({ ...lecture, currentAttendees: currentAttendees++ });
      });

      mockLectureRepo.increment.mockImplementation(() => {
        return Promise.resolve({ affected: currentAttendees <= 30 ? 1 : 0 });
      });

      // 29번째 등록 (성공해야 함)
      let result = await lectureRepository.incrementConcurrency(1);
      expect(result).toBe(true);

      // 30번째 등록 (성공해야 함)
      result = await lectureRepository.incrementConcurrency(1);
      expect(result).toBe(true);

      // 31번째 등록 (실패해야 함)
      result = await lectureRepository.incrementConcurrency(1);
      expect(result).toBe(false);
    });
  });

  describe('에러 케이스 테스트', () => {
    it('Redis 락 획득 실패 시 false를 반환해야 함', async () => {
      (redLock.acquire as jest.Mock).mockRejectedValue(new Error('Lock acquisition failed'));

      const result = await lectureRepository.incrementConcurrency(1);

      expect(result).toBe(false);
    });
  });

  describe('경계값 테스트', () => {
    it('수강 인원이 0명일 때 등록 성공해야 함', async () => {
      mockLectureRepo.findOne.mockResolvedValue({ id: 1, currentAttendees: 0, capacity: 30 });
      mockLectureRepo.increment.mockResolvedValue({ affected: 1 });

      const result = await lectureRepository.incrementConcurrency(1);

      expect(result).toBe(true);
    });

    it('수강 인원이 capacity와 같을 때 등록 실패해야 함', async () => {
      mockLectureRepo.findOne.mockResolvedValue({ id: 1, currentAttendees: 30, capacity: 30 });

      const result = await lectureRepository.incrementConcurrency(1);

      expect(result).toBe(false);
    });
  });
});