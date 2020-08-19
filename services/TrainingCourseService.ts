import Volunteer from '../models/Volunteer';

module.exports = {
  recordProgress: async (volunteer: any, courseKey: string, materialKey: string) => {
    // Early exit if already saved progress
    const courseProgress = volunteer.trainingCourses[courseKey]
    if (courseProgress.completedMaterials.includes(materialKey)) return

    // TODO: update progress percentage & isComplete
    return Volunteer.updateOne(
      { _id: volunteer._id },
      { $addToSet: { [`trainingCourses.${courseKey}.completedMaterials`]: materialKey } }
    );
  }
}
