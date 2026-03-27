import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeJobDescription } from '@/lib/analysis';
import { extractTextFromFile, persistUploadedFile } from '@/lib/file';

export const runtime = 'nodejs';

export async function GET() {
  const jobs = await prisma.job.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const title = String(formData.get('title') || 'Untitled Role');
  const department = String(formData.get('department') || '');
  const pastedDescription = String(formData.get('description') || '');
  const jdFile = formData.get('jobDescriptionFile') as File | null;

  let descriptionText = pastedDescription;
  let uploadedMeta: { fileName: string; fullPath: string } | null = null;

  if (jdFile && jdFile.size > 0) {
    const persisted = await persistUploadedFile(jdFile, 'job-description');
    descriptionText = await extractTextFromFile(jdFile.name, jdFile.type, persisted.buffer);
    uploadedMeta = { fileName: persisted.fileName, fullPath: persisted.fullPath };
  }

  if (!descriptionText.trim()) {
    return NextResponse.json({ error: 'Job description is required.' }, { status: 400 });
  }

  const analysis = analyzeJobDescription(descriptionText);

  const job = await prisma.job.create({
    data: {
      title: title || analysis.jobTitle,
      department: department || null,
      description: descriptionText,
      requiredQualificationsJson: JSON.stringify(analysis.requiredQualifications),
      preferredQualificationsJson: JSON.stringify(analysis.preferredQualifications),
      skillsJson: JSON.stringify(analysis.skills),
      experienceRequirements: analysis.experienceRequirements,
      educationRequirements: analysis.educationRequirements,
      certificationsJson: JSON.stringify(analysis.certifications),
      responsibilitiesJson: JSON.stringify(analysis.responsibilities),
      softSkillsJson: JSON.stringify(analysis.softSkills)
    }
  });

  if (uploadedMeta) {
    await prisma.candidateDocument.create({
      data: {
        jobId: job.id,
        type: 'JOB_DESCRIPTION',
        fileName: uploadedMeta.fileName,
        filePath: uploadedMeta.fullPath,
        extractedText: descriptionText,
        mimeType: jdFile?.type || 'application/octet-stream'
      }
    });
  }

  return NextResponse.json(job, { status: 201 });
}
