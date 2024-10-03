import { Test, TestingModule } from '@nestjs/testing';
import { LectureRepository } from '../infra/repository/lecture.repository';
import { Lecture } from '../domain/entity/lecture.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LessThan, Repository, UpdateResult } from 'typeorm';

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
});