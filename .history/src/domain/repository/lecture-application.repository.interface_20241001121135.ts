import { LectureApplication } from '../entity/lecture-application.entity';

export interface LectureApplicationRepositoryImpl {
  findByUserIdAndLectureId(userId: string, lectureId: number): Promise<LectureApplication | null>;
  save(application: LectureApplication): Promise<LectureApplication>;
  findByUserId(userId: string): Promise<LectureApplication[]>;
}