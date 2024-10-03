import { Test, TestingModule } from '@nestjs/testing';
import { LectureRepository } from '../infra/repository/lecture.repository';
import { Lecture } from '../domain/entity/lecture.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('LectureRepository', () => {
  let lectureRepository: LectureRepository;
  let mockLectureRepo: Partial<Record<keyof Repository<Lecture>, jest.Mock>>;

  beforeEach(async () => {
    mockLectureRepo = {
      findOne: jest.fn(),
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

  describe('동시성 테스트', () => {
    it('여러 요청이 동시에 들어올 때 정확히 30명만 등록되어야 함', async () => {
      let currentAttendees = 0;
      const capacity = 30;

      mockLectureRepo.findOne.mockImplementation(() => 
        Promise.resolve({ id: 1, currentAttendees, capacity })
      );

      mockLectureRepo.increment.mockImplementation(() => {
        if (currentAttendees < capacity) {
          currentAttendees++;
          return Promise.resolve({ affected: 1 });
        }
        return Promise.resolve({ affected: 0 });
      });

      const promises = Array(50).fill(null).map(() => lectureRepository.incrementConcurrency(1));
      const results = await Promise.all(promises);

      const successCount = results.filter(result => result).length;

      expect(successCount).toBe(30);
      expect(currentAttendees).toBe(30);
      expect(mockLectureRepo.findOne).toHaveBeenCalledTimes(50);
      expect(mockLectureRepo.increment).toHaveBeenCalledTimes(50);
    });
  });

  describe('정확히 30명 제한 테스트', () => {
    it('29명일 때는 등록 성공, 30명일 때는 등록 성공, 31명째는 등록 실패해야 함', async () => {
      let currentAttendees = 28;  // 28로 시작
      const capacity = 30;
  
      mockLectureRepo.findOne.mockImplementation(() => 
        Promise.resolve({ id: 1, currentAttendees, capacity })
      );
  
      mockLectureRepo.increment.mockImplementation(() => {
        if (currentAttendees < capacity) {
          currentAttendees++;
          return Promise.resolve({ affected: 1 });
        }
        return Promise.resolve({ affected: 0 });
      });
  
      // 29명일 때 (성공)
      let result = await lectureRepository.incrementConcurrency(1);
      expect(result).toBe(true);
      expect(currentAttendees).toBe(29);
  
      // 30명일 때 (성공)
      result = await lectureRepository.incrementConcurrency(1);
      expect(result).toBe(true);
      expect(currentAttendees).toBe(30);
  
      // 31명째 (실패)
      result = await lectureRepository.incrementConcurrency(1);
      expect(result).toBe(false);
      expect(currentAttendees).toBe(30);
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