import mongoose from "mongoose";
import dotenv from "dotenv";
import { Quiz } from "../models/Quiz.js";
import { QuestionGroup } from "../models/QuestionGroup.js";
import { Question } from "../models/Question.js";
import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js"; // Import Organization model
import { importQuestions } from "../services/quiz.service.js";

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/eduthrive360";
  console.log("Connecting to:", uri);
  await mongoose.connect(uri);
  console.log("Connected to database");

  // Get a mock super admin requester object
  const requester = {
    _id: new mongoose.Types.ObjectId(),
    role: "super_admin",
  };

  // 0. Create a dummy organization to satisfy populate reference
  console.log("Creating test organization...");
  const org = await Organization.create({
    name: "Test Import Organization",
    code: "TESTIMPORT_" + Math.random().toString(36).substring(7).toUpperCase(),
    type: "school",
  });

  // 1. Create a dummy Quiz to test on
  console.log("Creating test quiz...");
  const quiz = await Quiz.create({
    title: "Test Import Flow Quiz",
    description: "Dummy quiz for checking csv/excel imports",
    status: "draft",
    organizationId: org._id,
    createdBy: requester._id,
  });

  // 2. Create one initial Question Group
  console.log("Creating initial group...");
  const initialGroup = await QuestionGroup.create({
    quizId: quiz._id,
    organizationId: quiz.organizationId,
    name: "Existing Group",
    type: "positive",
    weight: 0.5,
    order: 0,
  });

  console.log("-------------------------------------------------");
  console.log("Test Case 1: Valid Import (with dynamic group creation)");
  console.log("-------------------------------------------------");

  const validCSV = `Question Text,Group Name,Factor Weight,Option 1 Label,Option 1 Value,Option 2 Label,Option 2 Value,Option 3 Label,Option 3 Value,Option 4 Label,Option 4 Value
"How happy are you at work?","Existing Group",1.0,"Rarely",1,"Sometimes",2,"Often",3,"Always",4
"I feel supported by my peers","New Dynamic Group",1.2,"","","","","","","",""
"Another question in dynamic group","New Dynamic Group",1.5,"","","","","","","",""`;

  const validBuffer = Buffer.from(validCSV, "utf-8");

  try {
    const res = await importQuestions(quiz._id.toString(), validBuffer, requester);
    console.log("Valid import result:", res);

    // Verify groups in DB
    const groups = await QuestionGroup.find({ quizId: quiz._id });
    console.log("Groups in DB after import (expecting 2):", groups.map(g => g.name));

    // Verify questions in DB
    const questions = await Question.find({ quizId: quiz._id });
    console.log("Questions in DB after import (expecting 3):", questions.map(q => ({
      text: q.questionText,
      group: groups.find(g => g._id.toString() === q.groupId.toString())?.name,
      weight: q.factorWeight,
      optionsCount: q.options?.length
    })));
  } catch (err) {
    console.error("Test Case 1 Failed:", err);
  }

  console.log("\n-------------------------------------------------");
  console.log("Test Case 2: Invalid Import (checking transactional rollback)");
  console.log("-------------------------------------------------");

  // CSV with a validation error on row 3 (missing group name) and row 4 (invalid factor weight)
  const invalidCSV = `Question Text,Group Name,Factor Weight
"Valid Question 1","Existing Group",1.0
"Missing Group Question","",1.2
"Invalid Weight Question","New Rolledback Group",-2.5`;

  const invalidBuffer = Buffer.from(invalidCSV, "utf-8");

  // Get counts before running invalid import
  const groupCountBefore = await QuestionGroup.countDocuments({ quizId: quiz._id });
  const questionCountBefore = await Question.countDocuments({ quizId: quiz._id });

  try {
    console.log("Attempting invalid import (expecting rejection)...");
    await importQuestions(quiz._id.toString(), invalidBuffer, requester);
    console.log("WARNING: Invalid import succeeded but should have failed!");
  } catch (err) {
    console.log("Rejection caught successfully as expected.");
    console.log("Validation details/errors:", err.details || err.message);

    // Verify that NO new groups or questions were created (atomic rollback check)
    const groupCountAfter = await QuestionGroup.countDocuments({ quizId: quiz._id });
    const questionCountAfter = await Question.countDocuments({ quizId: quiz._id });

    console.log(`Groups count before: ${groupCountBefore} -> after: ${groupCountAfter} (Should be equal)`);
    console.log(`Questions count before: ${questionCountBefore} -> after: ${questionCountAfter} (Should be equal)`);

    if (groupCountBefore === groupCountAfter && questionCountBefore === questionCountAfter) {
      console.log("SUCCESS: Transaction rolled back completely. No partial entries created!");
    } else {
      console.log("FAILURE: Partial updates persisted. Rollback failed!");
    }
  }

  // Cleanup test data
  console.log("\nCleaning up test data...");
  await Question.deleteMany({ quizId: quiz._id });
  await QuestionGroup.deleteMany({ quizId: quiz._id });
  await Quiz.deleteOne({ _id: quiz._id });
  await Organization.deleteOne({ _id: org._id });

  await mongoose.disconnect();
  console.log("Disconnected from database");
}

run().catch(console.error);
