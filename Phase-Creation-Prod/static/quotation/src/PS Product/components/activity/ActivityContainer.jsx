import React from "react"; // Importing React to use JSX and component features

import ActivityHeader from "./ActivityHeader"; // Importing the component that displays activity header details

import ActivityProducts from "./ActivityProducts"; // Importing the component that displays product-related UI

// Exporting the main component so it can be used elsewhere in the application
export default function ActivityContainer({
  jsonData, // Contains activity data passed from parent component
  onToggleActivity, // Callback function to handle expand/collapse activity
  onUpdateProductValue, // Callback to update product-level data
  onUpdateSubValue, // Callback to update sub-activity data
}) {
  return (
    <section className="section">
      {" "}
      {/* // Main wrapper section for styling/layout <h2>Activities</h2> // Section */}
      <div id="activityContainer">
        {" "}
        {/* // Container for looping through all activities */}
        {Object.entries(jsonData.activities).map(
          // Converts activities object into [key, value] pairs and loops through them
          (
            [activityName, activityObj] // Destructuring each activity entry
          ) => (
            <div key={activityName} className="section">
              {" "}
              {/* // Wrapper for each single activity block */}
              <ActivityHeader // Component to display activity title & toggle controls
                activityName={activityName} // Passing activity name as prop
                activityObj={activityObj} // Passing activity data object as prop
                onToggle={onToggleActivity} // Passing toggle function as prop
              />
              <ActivityProducts // Component to display product details under the activity
                activityName={activityName} // Passing activity name
                activityObj={activityObj} // Passing activity data object
                onUpdateProductValue={onUpdateProductValue} // Callback to update product value
                onUpdateSubValue={onUpdateSubValue} // Callback to update sub-activity value
              />
            </div>
          )
        )}
      </div>
    </section>
  );
}
