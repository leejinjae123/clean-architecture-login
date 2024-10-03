import { Injectable } from '@nestjs/common';
import { LectureRepositoryInterFace } from '../../domain/repository/lecture.repository.interface';
import { LectureApplicationRepositoryInterFace } from '../../domain/repository/lecture-application.repository.interface';
import { LectureApplication } from '../../domain/entity/lecture-application.entity';
import { Lecture } from '../../domain/entity/lecture.entity';

@Injectable()
export class ApplyForLectureUseCase {
  constructor(
    private lectureRepo: LectureRepositoryInterFace,
    private lectureApplicationRepo: LectureApplicationRepositoryInterFace,
  ) {}

  async findById(userId: string, lectureId: number): Promise<boolean> {
    const lecture = await this.lectureRepo.findById(lectureId);
    if (!lecture) {
      throw new Error('Lecture not found');
    }

    const existingApplication = await this.lectureApplicationRepo.findByUserIdAndLectureId(userId, lectureId);
    if (existingApplication) {
      throw new Error('User has already applied for this lecture');
    }

    if (lecture.currentAttendees >= lecture.capacity) {
      throw new Error('Lecture is already full');
    }

    lecture.currentAttendees += 1;
    await this.lectureRepo.save(lecture);

    const application = new LectureApplication();
    application.userId = userId;
    application.lecture = lecture;
    application.appliedAt = new Date();
    await this.lectureApplicationRepo.save(application);

    return true;
  }
  async findAvailableLecturesByDate(date: Date): Promise<Lecture[]> {
    return this.lectureRepo.findAvailableLecturesByDate(date);
  }

  async findByUserId(userId: string): Promise<LectureApplication[]> {
    return this.lectureApplicationRepo.findByUserId(userId);
  }
}
