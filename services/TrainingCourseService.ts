import Volunteer from '../models/Volunteer';
const { getCourse } = require('../utils/training-courses');

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
    // Early exit if already saved progress
    const courseProgress = volunteer.trainingCourses[courseKey];
    if (courseProgress.completedMaterials.includes(materialKey)) return;

    // TODO: update progress percentage & isComplete
    return Volunteer.updateOne(
      { _id: volunteer._id },
      { $addToSet: { [`trainingCourses.${courseKey}.completedMaterials`]: materialKey } }
    );
  }
}
