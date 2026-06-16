/**
 * Demo data for taking a quiz on the User app (http://localhost:5174).
 * Run: npm run seed:demo
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { Quiz } from "../models/Quiz.js";
import { QuestionGroup } from "../models/QuestionGroup.js";
import { Question, DEFAULT_OPTIONS } from "../models/Question.js";

const SALT_ROUNDS = 10;

const DEMO = {
  orgName: "Demo High School",
  orgCode: "DEMO01",
  userEmail: "student@demo.em360.io",
  userPassword: "Student1234!",
  userName: "Demo Student",
  orgAdminEmail: "orgadmin@demo.em360.io",
  orgAdminPassword: "OrgAdmin1234!",
  quizTitle: "Wellness Check (Demo)",
};

async function seedDemo() {
  await connectDB();

  let org = await Organization.findOne({ code: DEMO.orgCode });
  if (!org) {
    org = await Organization.create({
      name: DEMO.orgName,
      type: "school",
      code: DEMO.orgCode,
      settings: {},
    });
    console.log(`Created organization: ${DEMO.orgName} (code: ${DEMO.orgCode})`);
  } else {
    console.log(`Organization exists: ${DEMO.orgName} (code: ${DEMO.orgCode})`);
  }

  let orgAdmin = await User.findOne({ email: DEMO.orgAdminEmail.toLowerCase() });
  if (!orgAdmin) {
    const passwordHash = await bcrypt.hash(DEMO.orgAdminPassword, SALT_ROUNDS);
    orgAdmin = await User.create({
      fullName: "Demo Org Admin",
      email: DEMO.orgAdminEmail.toLowerCase(),
      passwordHash,
      role: "org_admin",
      organizationId: org._id,
    });
    console.log(`Created org admin: ${DEMO.orgAdminEmail}`);
  }

  let student = await User.findOne({ email: DEMO.userEmail.toLowerCase() });
  if (!student) {
    const passwordHash = await bcrypt.hash(DEMO.userPassword, SALT_ROUNDS);
    student = await User.create({
      fullName: DEMO.userName,
      email: DEMO.userEmail.toLowerCase(),
      passwordHash,
      role: "user",
      organizationId: org._id,
      memberType: "student",
      age: 16,
    });
    console.log(`Created student: ${DEMO.userEmail}`);
  } else {
    console.log(`Student exists: ${DEMO.userEmail}`);
  }

  let quiz = await Quiz.findOne({
    organizationId: org._id,
    title: DEMO.quizTitle,
  });

  if (!quiz) {
    quiz = await Quiz.create({
      organizationId: org._id,
      title: DEMO.quizTitle,
      description: "A short demo quiz with positive and distress scales.",
      status: "published",
      settings: {
        scoringModel: "weighted",
        allowPartialSubmission: false,
        totalQuestions: 4,
        estimatedTime: 5,
      },
      createdBy: orgAdmin._id,
    });

    const positive = await QuestionGroup.create({
      quizId: quiz._id,
      organizationId: org._id,
      name: "SEHS-S (Positive)",
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
      "I feel good about my life.",
      "I am satisfied with myself.",
    ];
    const negativeQs = [
      "I feel nervous or stressed.",
      "I have trouble relaxing.",
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

    console.log(`Created published quiz: "${DEMO.quizTitle}" (4 questions)`);
  } else {
    if (quiz.status !== "published") {
      quiz.status = "published";
      await quiz.save();
      console.log(`Published existing quiz: "${DEMO.quizTitle}"`);
    } else {
      console.log(`Quiz already published: "${DEMO.quizTitle}"`);
    }
  }

  console.log("\n--- User app login (take quiz) ---");
  console.log("URL:      http://localhost:5174/login");
  console.log("Email:   ", DEMO.userEmail);
  console.log("Password:", DEMO.userPassword);
  console.log("\n--- Or register a new student ---");
  console.log("URL:      http://localhost:5174/register");
  console.log("Org code:", DEMO.orgCode);
  console.log("Member:   student or employee");

  process.exit(0);
}

seedDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});
