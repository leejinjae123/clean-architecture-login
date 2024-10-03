import { Test, TestingModule } from '@nestjs/testing';
import { LectureApplicationRepository } from '../infra/repository/lecture-application.repository';
import { LectureApplication } from '../domain/entity/lecture-application.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('LectureApplicationRepository', () => {
  let lectureApplicationRepository: LectureApplicationRepository;
  let mockLectureApplicationRepo: Repository<LectureApplication>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LectureApplicationRepository,
        {
          provide: getRepositoryToken(LectureApplication),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    lectureApplicationRepository = module.get<LectureApplicationRepository>(LectureApplicationRepository);
    mockLectureApplicationRepo = module.get(getRepositoryToken(LectureApplication));
  });

  it('findByUserIdAndLectureId should return an application or null', async () => {
    const application = new LectureApplication();
    mockLectureApplicationRepo.findOne.mockResolvedValue(application);

    const result = await lectureApplicationRepository.findByUserIdAndLectureId('user1', 1);
    expect(result).toEqual(application);
    expect(mockLectureApplicationRepo.findOne).toHaveBeenCalledWith({
      where: { userId: 'user1', lecture: { id: 1 } },
    });
  });

  it('save should return the saved application', async () => {
    const application = new LectureApplication();
    mockLectureApplicationRepo.save.mockResolvedValue(application);

    const result = await lectureApplicationRepository.save(application);
    expect(result).toEqual(application);
    expect(mockLectureApplicationRepo.save).toHaveBeenCalledWith(application);
  });

  it('findByUserId should return applications for a user', async () => {
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
