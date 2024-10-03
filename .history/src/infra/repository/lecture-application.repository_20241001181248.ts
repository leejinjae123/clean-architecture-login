import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LectureApplication } from '../../domain/entity/lecture-application.entity';
import { LectureApplicationRepositoryInterFace } from '../../domain/repository/lecture-application.repository.interface';

@Injectable()
export class LectureApplicationRepository implements LectureApplicationRepositoryInterFace {
  constructor(
    @InjectRepository(LectureApplication)
    private lectureApplicationRepo: Repository<LectureApplication>,
  ) {}

  async findByUserIdAndLectureId(   userId: string, lectureId: number): Promise<LectureApplication | null> {
    return this.lectureApplicationRepo.findOne({
      where: { userId, lecture: { id: lectureId } },
    });
  }

  async save(application: LectureApplication): Promise<LectureApplication> {
    return this.lectureApplicationRepo.save(application);
  }

  async findByUserId(userId: string): Promise<LectureApplication[]> {
    return this.lectureApplicationRepo.find({
      where: { userId },
      relations: ['lecture'],
    });
  }
}