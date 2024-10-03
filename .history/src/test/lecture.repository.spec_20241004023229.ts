import { Test, TestingModule } from '@nestjs/testing';
import { LectureRepository } from '../infra/repository/lecture.repository';
import { Lecture } from '../domain/entity/lecture.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('LectureRepository', () => {
  let lectureRepository: LectureRepository;
  let mockLectureRepo: Repository<Lecture>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LectureRepository,
        {
          provide: getRepositoryToken(Lecture),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            increment: jest.fn(),
          },
        },
      ],
    }).compile();

    lectureRepository = module.get<LectureRepository>(LectureRepository);
    mockLectureRepo = module.get(getRepositoryToken(Lecture));
  });

  it('findById should return a lecture or null', async () => {
    const lecture = new Lecture();
    mockLectureRepo.findOne.mockResolvedValue(lecture);

    const result = await lectureRepository.findById(1);
    expect(result).toEqual(lecture);
    expect(mockLectureRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('findAvailableLecturesByDate should return available lectures', async () => {
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

  it('save should return the saved lecture', async () => {
    const lecture = new Lecture();
    mockLectureRepo.save.mockResolvedValue(lecture);

    const result = await lectureRepository.save(lecture);
    expect(result).toEqual(lecture);
    expect(mockLectureRepo.save).toHaveBeenCalledWith(lecture);
  });

  it('incrementConcurrency should return true when increment is successful', async () => {
    mockLectureRepo.increment.mockResolvedValue({ affected: 1 });

    const result = await lectureRepository.incrementConcurrency(1);
    expect(result).toBe(true);
    expect(mockLectureRepo.increment).toHaveBeenCalledWith(
      { id: 1 },
      'currentAttendees',
      1,
    );
  });
});
