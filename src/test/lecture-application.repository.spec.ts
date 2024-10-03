import { Test, TestingModule } from '@nestjs/testing';
import { LectureApplicationRepository } from '../infra/repository/lecture-application.repository';
import { LectureApplication } from '../domain/entity/lecture-application.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('LectureApplicationRepository', () => {
  let lectureApplicationRepository: LectureApplicationRepository;
  let mockLectureApplicationRepo: Partial<Record<keyof Repository<LectureApplication>, jest.Mock>>;

  beforeEach(async () => {
    mockLectureApplicationRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LectureApplicationRepository,
        {
          provide: getRepositoryToken(LectureApplication),
          useValue: mockLectureApplicationRepo,
        },
      ],
    }).compile();

    lectureApplicationRepository = module.get<LectureApplicationRepository>(LectureApplicationRepository);
  });

  it('findByUserIdAndLectureId는 신청 정보를 반환하거나 null을 반환해야 함', async () => {
    const application = new LectureApplication();
    mockLectureApplicationRepo.findOne.mockResolvedValue(application);

    const result = await lectureApplicationRepository.findByUserIdAndLectureId('user1', 1);
    expect(result).toEqual(application);
    expect(mockLectureApplicationRepo.findOne).toHaveBeenCalledWith({
      where: { userId: 'user1', lecture: { id: 1 } },
    });
  });

  it('save는 저장된 신청 정보를 반환해야 함', async () => {
    const application = new LectureApplication();
    mockLectureApplicationRepo.save.mockResolvedValue(application);

    const result = await lectureApplicationRepository.save(application);
    expect(result).toEqual(application);
    expect(mockLectureApplicationRepo.save).toHaveBeenCalledWith(application);
  });

  it('findByUserId는 사용자의 신청 목록을 반환해야 함', async () => {
    const applications = [new LectureApplication(), new LectureApplication()];
    mockLectureApplicationRepo.find.mockResolvedValue(applications);

    const result = await lectureApplicationRepository.findByUserId('user1');
    expect(result).toEqual(applications);
    expect(mockLectureApplicationRepo.find).toHaveBeenCalledWith({
      where: { userId: 'user1' },
      relations: ['lecture'],
    });
  });
});