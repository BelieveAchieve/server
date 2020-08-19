import Volunteer from '../models/Volunteer';
const { getCourse, getProgress } = require('../utils/training-courses');

module.exports = {
  getCourse: (volunteer: any, courseKey: string) => {
    const course = getCourse(courseKey);
    if (!course) return;
    const courseProgress = volunteer.trainingCourses[courseKey]
    course.modules.forEach(mod => {
      mod.materials.forEach(mat => {
        mat.isCompleted = courseProgress.completedMaterials.includes(
          mat.materialKey
        );
      });
    });
    return course;
  },

  recordProgress: async (volunteer: any, courseKey: string, materialKey: string) => {
    const courseProgress = volunteer.trainingCourses[courseKey];

    // Early exit if already saved progress
    if (courseProgress.completedMaterials.includes(materialKey)) return;

    // Mutate user object's completedMaterials
    courseProgress.completedMaterials.push(materialKey)
    const progress = getProgress(courseKey, courseProgress.completedMaterials);
    const isComplete = progress === 100;

    await Volunteer.updateOne(
      { _id: volunteer._id },
      {
        $set: {
          [`trainingCourses.${courseKey}.isComplete`]: isComplete,
          [`trainingCourses.${courseKey}.progress`]: progress
        },
        $addToSet: { [`trainingCourses.${courseKey}.completedMaterials`]: materialKey }
      }
    );

    return { progress, isComplete };
  }
}
