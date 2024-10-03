import { Test, TestingModule } from '@nestjs/testing';
import { Lecture } from '../domain/entity/lecture.entity';
import { LectureApplication } from '../domain/entity/lecture-application.entity';
import { LectureUseCase } from '../application/usecase/lecture.use-case';
import { LectureRepository } from '../infra/repository/lecture.repository';
import { LectureApplicationRepository } from '../infra/repository/lecture-application.repository';

describe('LectureUseCase', () => {
  let lectureUseCase: LectureUseCase;
  let lectureRepo: jest.Mocked<LectureRepository>;
  let lectureApplicationRepo: jest.Mocked<LectureApplicationRepository>;

  beforeEach(async () => {
    // NestJS TestingModule 설정
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LectureUseCase, // LectureUseCase를 provider로 등록
        {
          provide: LectureRepository,
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
            findAvailableLecturesByDate: jest.fn(),
            incrementConcurrency: jest.fn(),
          }, // mock된 LectureRepository 제공
        },
        {
          provide: LectureApplicationRepository,
          useValue: {
            findByUserIdAndLectureId: jest.fn(),
            save: jest.fn(),
            findByUserId: jest.fn(),
          }, // mock된 LectureApplicationRepository 제공
        },
      ],
    }).compile();

    // LectureUseCase 인스턴스를 주입받음
    lectureUseCase = module.get<LectureUseCase>(LectureUseCase);
    
    // mock 객체를 강제로 타입 캐스팅하여 사용
    lectureRepo = module.get(LectureRepository) as jest.Mocked<LectureRepository>;
    lectureApplicationRepo = module.get(LectureApplicationRepository) as jest.Mocked<LectureApplicationRepository>;

    it('실행됨', () => {
      expect(lectureUseCase).toBeDefined();
    });
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

    it('강의가 이미 가득 찼을 때 에러를 던져야 함', async () => {
      const lecture = new Lecture();
      lecture.currentAttendees = 10;
      lecture.capacity = 10;
      lectureRepo.findById.mockResolvedValue(lecture);
      lectureApplicationRepo.findByUserIdAndLectureId.mockResolvedValue(null);

      await expect(lectureUseCase.findById('user1', 1)).rejects.toThrow('Lecture is already full');
    });

    it('사용자를 강의에 성공적으로 등록해야 함', async () => {
      const lecture = new Lecture();
      lecture.id = 1;
      lecture.currentAttendees = 5;
      lecture.capacity = 10;
      lectureRepo.findById.mockResolvedValue(lecture);
      lectureApplicationRepo.findByUserIdAndLectureId.mockResolvedValue(null);

      const result = await lectureUseCase.findById('user1', 1);

      expect(result).toBe(true);
      expect(lecture.currentAttendees).toBe(6);
      expect(lectureRepo.save).toHaveBeenCalledWith(lecture);
      expect(lectureApplicationRepo.save).toHaveBeenCalledWith(expect.any(LectureApplication));
    });
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
