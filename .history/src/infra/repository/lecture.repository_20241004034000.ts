import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Lecture } from '../../domain/entity/lecture.entity';
import { LectureRepositoryInterFace } from '../../domain/repository/lecture.repository.interface';

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
    const lecture = await this.lectureRepo.findOne({ where: { id: lectureId } });
    if (!lecture || lecture.currentAttendees >= lecture.capacity) {
      return false;
    }

    const result = await this.lectureRepo.increment({ id: lectureId }, 'currentAttendees', 1);
    return result.affected === 1;
  }
}
