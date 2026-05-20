/**
 * Add a published quiz to an organization by MongoDB id.
 * Usage: node src/scripts/seed-quiz-for-org.js <organizationId>
 *    or: ORG_ID=... npm run seed:quiz-org
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { Quiz } from "../models/Quiz.js";
import { QuestionGroup } from "../models/QuestionGroup.js";
import { Question, DEFAULT_OPTIONS } from "../models/Question.js";

const orgId = process.argv[2] ?? process.env.ORG_ID;
const QUIZ_TITLE = process.env.QUIZ_TITLE ?? "Wellness Check";

async function seedQuizForOrg() {
  if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
    console.error("Usage: node src/scripts/seed-quiz-for-org.js <organizationId>");
    process.exit(1);
  }

  await connectDB();

  const org = await Organization.findById(orgId);
  if (!org) {
    console.error(`Organization not found: ${orgId}`);
    process.exit(1);
  }

  let creator = await User.findOne({ organizationId: org._id, role: "org_admin" });
  if (!creator) {
    creator = await User.findOne({ organizationId: org._id, role: "super_admin" });
  }
  if (!creator) {
    creator = await User.findOne({ role: "super_admin" });
  }
  if (!creator) {
    console.error("No org_admin or super_admin found to set as quiz creator");
    process.exit(1);
  }

  let quiz = await Quiz.findOne({ organizationId: org._id, title: QUIZ_TITLE });

  if (!quiz) {
    quiz = await Quiz.create({
      organizationId: org._id,
      title: QUIZ_TITLE,
      description: "Assessment of positive mental health and distress indicators.",
      status: "published",
      settings: {
        scoringModel: "weighted",
        allowPartialSubmission: false,
        totalQuestions: 6,
        estimatedTime: 10,
      },
      createdBy: creator._id,
    });
  } else {
    quiz.status = "published";
    quiz.description =
      quiz.description ||
      "Assessment of positive mental health and distress indicators.";
    await quiz.save();
  }

  const existingGroups = await QuestionGroup.countDocuments({ quizId: quiz._id });
  if (existingGroups > 0) {
    console.log(`Quiz already has groups: "${QUIZ_TITLE}" (${quiz._id})`);
    console.log(`Organization: ${org.name} (${org.code})`);
    process.exit(0);
  }

  const positive = await QuestionGroup.create({
    quizId: quiz._id,
    organizationId: org._id,
    name: "SEHS-S (Positive Mental Health)",
    type: "positive",
    weight: 0.5,
    scoringMethod: "average",
    riskRanges: [
      { label: "Low", min: 3, max: 4 },
      { label: "Medium", min: 2, max: 3 },
      { label: "High", min: 1, max: 2 },
    ],
    order: 0,
  });

  const negative = await QuestionGroup.create({
    quizId: quiz._id,
    organizationId: org._id,
    name: "SEDS-S (Distress)",
    type: "negative",
    weight: 0.5,
    scoringMethod: "average",
    riskRanges: [
      { label: "Low", min: 3, max: 4 },
      { label: "Medium", min: 2, max: 3 },
      { label: "High", min: 1, max: 2 },
    ],
    order: 1,
  });

  const positiveQs = [
    "I feel satisfied with my life.",
    "I feel good about myself.",
    "I am interested and involved in life.",
  ];
  const negativeQs = [
    "I feel nervous or stressed.",
    "I have trouble relaxing.",
    "I feel down or discouraged.",
  ];

  let order = 0;
  for (const text of positiveQs) {
    await Question.create({
      quizId: quiz._id,
      groupId: positive._id,
      organizationId: org._id,
      questionText: text,
      options: DEFAULT_OPTIONS,
      factorWeight: 1,
      order: order++,
    });
  }
  for (const text of negativeQs) {
    await Question.create({
      quizId: quiz._id,
      groupId: negative._id,
      organizationId: org._id,
      questionText: text,
      options: DEFAULT_OPTIONS,
      factorWeight: 1,
      order: order++,
    });
  }

  await Quiz.findByIdAndUpdate(quiz._id, {
    "settings.totalQuestions": order,
  });

  console.log(`Created published quiz: "${QUIZ_TITLE}"`);
  console.log(`  Quiz id:  ${quiz._id}`);
  console.log(`  Org:      ${org.name} (code: ${org.code})`);
  console.log(`  Questions: ${order}`);
  console.log(`  Creator:  ${creator.email}`);

  process.exit(0);
}

seedQuizForOrg().catch((err) => {
  console.error(err);
  process.exit(1);
});
