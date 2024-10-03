import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { LectureUseCase } from '../../application/usecase/lecture.use-case';

@Controller('lectures')
export class LectureController {
  constructor(
        private LectureUseCase: LectureUseCase,
  ) {}
  @Post('apply')
  async applyForLecture(@Body() body: { userId: string; lectureId: number }) {
    return this.LectureUseCase.findById(body.userId, body.lectureId);
  }

  @Get('available')
  async getAvailableLectures(@Query('date') date: string) {
    return this.LectureUseCase.findAvailableLecturesByDate(new Date(date));
  }

  @Get('user/:userId')
  async getUserLectures(@Param('userId') userId: string) {
    return this.LectureUseCase.findByUserId(userId);
  }
}