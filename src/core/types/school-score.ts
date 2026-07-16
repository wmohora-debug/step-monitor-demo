export interface SchoolScoreResponseDto {
  schoolId: string;
  schoolName: string;
  formSubmissionScore: number;
  complianceScore: number;
  trainingScore: number;
  totalScore: number;
  grade: "A" | "B" | "C" | "D" | "E" | "F";
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchoolScoreDto {
  schoolId: string;
  formSubmissionScore: number;
  complianceScore: number;
  trainingScore: number;
}

export interface UpdateSchoolScoreDto {
  formSubmissionScore?: number;
  complianceScore?: number;
  trainingScore?: number;
}

export interface PaginatedSchoolScoreResponseDto {
  items: SchoolScoreResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SchoolScoreListQuery {
  page?: number;
  limit?: number;
  search?: string;
}
