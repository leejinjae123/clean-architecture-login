import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Lecture } from './lecture.entity';

@Entity()
export class LectureApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @ManyToOne(() => Lecture)
  lecture: Lecture;

  @Column()
  appliedAt: Date;
}