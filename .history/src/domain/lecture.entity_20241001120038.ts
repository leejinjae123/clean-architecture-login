import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Lecture {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lecturer: string;

  @Column()
  date: Date;

  @Column({ default: 30 })
  capacity: number;

  @Column({ default: 0 })
  currentAttendees: number;
}