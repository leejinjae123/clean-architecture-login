import { Test, TestingModule } from '@nestjs/testing';
import { LectureUseCase } from '../application/usecase/lecture.use-case';
import { Lecture } from '../domain/entity/lecture.entity';
import { LectureApplication } from '../domain/entity/lecture-application.entity';
import { LectureRepository } from '../infra/repository/lecture.repository';
import { LectureApplicationRepository } from '../infra/repository/lecture-application.repository';

describe('LectureUseCase', () => {
  let lectureUseCase: LectureUseCase;
  let lectureRepo: jest.Mocked<LectureRepository>;
  let lectureApplicationRepo: jest.Mocked<LectureApplicationRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LectureUseCase,
        {
          provide: LectureRepository,
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
            findAvailableLecturesByDate: jest.fn(),
            incrementConcurrency: jest.fn(),
          },
        },
        {
          provide: LectureApplicationRepository,
          useValue: {
            findByUserIdAndLectureId: jest.fn(),
            save: jest.fn(),
            findByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    lectureUseCase = module.get<LectureUseCase>(LectureUseCase);
    lectureRepo = module.get(LectureRepository) as jest.Mocked<LectureRepository>;
    lectureApplicationRepo = module.get(LectureApplicationRepository) as jest.Mocked<LectureApplicationRepository>;
  });

  describe('findById', () => {
    it('강의를 찾을 수 없을 때 에러를 던져야 함', async () => {
      lectureRepo.findById.mockResolvedValue(null);

      await expect(lectureUseCase.findById('user1', 1)).rejects.toThrow('Lecture not found');
    });

    it('사용자가 이미 신청한 경우 에러를 던져야 함', async () => {
      const lecture = new Lecture();
      lectureRepo.findById.mockResolvedValue(lecture);
      lectureApplicationRepo.findByUserIdAndLectureId.mockResolvedValue(new LectureApplication());

      await expect(lectureUseCase.findById('user1', 1)).rejects.toThrow('User has already applied for this lecture');
    });

    // ... 다른 테스트 케이스들 ...
  });

  describe('findAvailableLecturesByDate', () => {
    it('주어진 날짜에 대해 사용 가능한 강의를 반환해야 함', async () => {
      const date = new Date();
      const lectures = [new Lecture(), new Lecture()];
      lectureRepo.findAvailableLecturesByDate.mockResolvedValue(lectures);

      const result = await lectureUseCase.findAvailableLecturesByDate(date);

      expect(result).toEqual(lectures);
      expect(lectureRepo.findAvailableLecturesByDate).toHaveBeenCalledWith(date);
    });
  });

  describe('findByUserId', () => {
    it('주어진 사용자에 대한 강의 신청 목록을 반환해야 함', async () => {
      const userId = 'user1';
      const applications = [new LectureApplication(), new LectureApplication()];
      lectureApplicationRepo.findByUserId.mockResolvedValue(applications);

      const result = await lectureUseCase.findByUserId(userId);

      expect(result).toEqual(applications);
      expect(lectureApplicationRepo.findByUserId).toHaveBeenCalledWith(userId);
    });
  });
});