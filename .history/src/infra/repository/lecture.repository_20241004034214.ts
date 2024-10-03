import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Lecture } from '../../domain/entity/lecture.entity';
import { LectureRepositoryInterFace } from '../../domain/repository/lecture.repository.interface';
import { redLock } from 'src/common/redis.config';

@Injectable()
export class LectureRepository implements LectureRepositoryInterFace {
  constructor(
    @InjectRepository(Lecture)
    private lectureRepo: Repository<Lecture>,
  ) {}

  async findById(id: number): Promise<Lecture | null> {
    return this.lectureRepo.findOne({ where: { id } });
  }

  async findAvailableLecturesByDate(date: Date): Promise<Lecture[]> {
    return this.lectureRepo.find({
      where: {
        date,
        currentAttendees: LessThan(Lecture['capacity'])
      },
    });
  }

  async save(lecture: Lecture): Promise<Lecture> {
    return this.lectureRepo.save(lecture);
  }

  async incrementConcurrency(lectureId: number): Promise<boolean> {
    const lockKey = `lecture:${lectureId}:lock`;
    
    try {
      const lock = await redLock.acquire([lockKey], 5000); // 5초 동안 락 획득 시도
  
      try {
        const lecture = await this.lectureRepo.findOne({ where: { id: lectureId } });
        
        if (!lecture || lecture.currentAttendees >= lecture.capacity) {
          return false;
        }
  
        lecture.currentAttendees += 1;
        await this.lectureRepo.save(lecture);
        return true;
      } finally {
        await lock.release();
      }
    } catch (error) {
      console.error('Failed to acquire lock:', error);
      return false;
    }
  }
}
