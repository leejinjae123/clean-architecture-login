import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LectureUseCase } from 'src/application/usecase/lecture.use-case';
import { LectureApplication } from "src/domain/entity/lecture-application.entity";
import { Lecture } from "src/domain/entity/lecture.entity";
import { LectureApplicationRepository } from "src/infra/repository/lecture-application.repository";
import { LectureRepository } from "src/infra/repository/lecture.repository";
import { LectureController } from 'src/interface/controller/lecture.controller';

@Module({
    imports: [
      TypeOrmModule.forFeature([Lecture, LectureApplication]),
    ],
    providers: [
      {
        provide: 'LectureRepositoryInterface',
        useClass: LectureRepository,
      },
      {
        provide: 'LectureApplicationRepositoryInterface',
        useClass: LectureApplicationRepository,
      },
      LectureUseCase,
    ],
    controllers: [LectureController],
  })
  export class LecturesModule {}