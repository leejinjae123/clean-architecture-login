import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lecture } from '../../domain/entity/lecture.entity';
import { LectureRepositoryInterFace } from '../../domain/repository/lecture.repository.interface';

@Injectable()
export class LectureRepository implements LectureRepositoryInterFace {
  constructor(
    @InjectRepository(Lecture)
    private lectureRepo: Repository<Lecture>
  ) {}

  async findById(id: number): Promise<Lecture | null> {
    return this.lectureRepo.findOne({ where: { id } });
  }

  async findAvailableLecturesByDate(date: Date): Promise<Lecture[]> {
    return this.lectureRepo.find({
      where: {
        date,
        currentAttendees: { $lt: 'capacity' },
      },
    });
  }

  async save(lecture: Lecture): Promise<Lecture> {
    return this.lectureRepo.save(lecture);
  }
}
