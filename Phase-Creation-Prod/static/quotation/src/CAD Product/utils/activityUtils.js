export const get2DActivities = (activities = {}) => {
  return Object.entries(activities)
    .filter(([activityName]) => activityName.startsWith("2D DELIVERABLES"))
    .map(([activityName, activityData]) => ({
      fullName: activityName,
      label: activityName.split("|")[1]?.trim(),
      include: activityData?.include ?? false,
      noOfComponent: activityData?.noOfComponent ?? 1,
    }));
};
