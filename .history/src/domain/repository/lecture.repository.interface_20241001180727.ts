import { Lecture } from '../entity/lecture.entity';

export interface LectureRepositoryInterFace {
  findById(id: number): Promise<Lecture | null>;
  findAvailableLecturesByDate(date: Date): Promise<Lecture[]>;
  save(lecture: Lecture): Promise<Lecture>;
}