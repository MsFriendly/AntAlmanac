import dispatcher from '../dispatcher';
import AppStore from '../stores/AppStore';
import {
    amber,
    blue,
    blueGrey,
    cyan,
    deepPurple,
    green,
    indigo,
    lightGreen,
    lime,
    pink,
    purple,
    red,
    teal,
} from '@material-ui/core/colors';
import { saveUserData } from '../components/App/FetchHelper';

const arrayOfColors = [
    red[500],
    pink[500],
    purple[500],
    indigo[500],
    deepPurple[500],
    blue[500],
    green[500],
    cyan[500],
    teal[500],
    lightGreen[500],
    lime[500],
    amber[500],
    blueGrey[500],
];

export const addCourse = (
    section,
    courseDetails,
    term,
    scheduleIndex,
    color
) => {
    const addedCourses = AppStore.getAddedCourses();

    let existingCourse;

    for (const course of addedCourses) {
        if (course.section.sectionCode === section.sectionCode) {
            existingCourse = course;
            if (course.scheduleIndices.includes(scheduleIndex)) {
                return;
            } else {
                break;
            }
        }
    }

    if (color === undefined) {
        const setOfUsedColors = new Set(
            addedCourses.map((course) => course.color)
        );

        color = arrayOfColors.find((materialColor) => {
            if (!setOfUsedColors.has(materialColor)) return materialColor;
        });

        if (color === undefined) color = '#5ec8e0';
    }

    if (existingCourse === undefined) {
        const newCourse = {
            color: color,
            term: term,
            deptCode: courseDetails.deptCode,
            courseNumber: courseDetails.courseNumber,
            courseTitle: courseDetails.courseTitle,
            courseComment: courseDetails.courseComment,
            prerequisiteLink: courseDetails.prerequisiteLink,
            scheduleIndices:
                scheduleIndex === 4 ? [0, 1, 2, 3] : [scheduleIndex],
            section: section,
        };
        dispatcher.dispatch({ type: 'ADD_COURSE', newCourse });
    } else {
        const newSection = {
            ...existingCourse,
            scheduleIndices:
                scheduleIndex === 4
                    ? [0, 1, 2, 3]
                    : existingCourse.scheduleIndices.concat(scheduleIndex),
        };
        dispatcher.dispatch({ type: 'ADD_SECTION', newSection });
    }
};

export const saveSchedule = async (userID) => {
    const addedCourses = AppStore.getAddedCourses();
    const customEvents = AppStore.getCustomEvents();

    const userScheduleData = { addedCourses: [], customEvents: customEvents };

    userScheduleData.addedCourses = addedCourses.map((course) => {
        return {
            color: course.color,
            term: course.term,
            sectionCode: course.section.sectionCode,
            scheduleIndices: course.scheduleIndices,
        };
    });
    //TODO: Snackbar
    await saveUserData(userID, userScheduleData);
};

export const loadSchedule = async (userData) => {
    dispatcher.dispatch({ type: 'LOAD_SCHEDULE', userData });
};

export const deleteCourse = (sectionCode, scheduleIndex) => {
    const addedCourses = AppStore.getAddedCourses();
    let deletedCourses = AppStore.getDeletedCourses();

    const addedCoursesAfterDelete = addedCourses.filter((course) => {
        if (course.section.sectionCode === sectionCode) {
            deletedCourses = deletedCourses.concat({
                ...course,
                scheduleIndex,
            });
            if (course.scheduleIndices.length === 1) {
                return false;
            } else {
                course.scheduleIndices = course.scheduleIndices.filter(
                    (index) => index !== scheduleIndex
                );

                return true;
            }
        }
        return true;
    });

    dispatcher.dispatch({
        type: 'DELETE_COURSE',
        addedCoursesAfterDelete,
        deletedCourses,
    });
};

export const deleteCustomEvent = (customEventID, scheduleIndex) => {
    const customEvents = AppStore.getCustomEvents();

    const customEventsAfterDelete = customEvents.filter((customEvent) => {
        if (customEvent.customEventID === customEventID) {
            if (customEvent.scheduleIndices.length === 1) {
                return false;
            } else {
                customEvent.scheduleIndices = customEvent.scheduleIndices.filter(
                    (index) => index !== scheduleIndex
                );

                return true;
            }
        }
        return true;
    });

    dispatcher.dispatch({
        type: 'DELETE_CUSTOM_EVENT',
        customEventsAfterDelete,
    });
};

export const changeCourseColor = (sectionCode) => {};

export const clearSchedules = (scheduleIndicesToClear) => {
    const addedCourses = AppStore.getAddedCourses();
    const customEvents = AppStore.getCustomEvents();

    const addedCoursesAfterClear = addedCourses.filter((course) => {
        if (course.scheduleIndices.length === 1) {
            return false;
        } else {
            course.scheduleIndices = course.scheduleIndices.filter(
                (index) => !scheduleIndicesToClear.includes(index)
            );

            return course.scheduleIndices.length !== 0;
        }
    });

    const customEventsAfterClear = customEvents.filter((customEvent) => {
        if (customEvent.scheduleIndices.length === 1) {
            return false;
        } else {
            customEvent.scheduleIndices = customEvent.scheduleIndices.filter(
                (index) => !scheduleIndicesToClear.includes(index)
            );

            return customEvent.scheduleIndices.length !== 0;
        }
    });

    dispatcher.dispatch({
        type: 'CLEAR_SCHEDULE',
        addedCoursesAfterClear,
        customEventsAfterClear,
    });
};

export const addCustomEvent = (customEvent) => {
    dispatcher.dispatch({ type: 'ADD_CUSTOM_EVENT', customEvent });
};

export const undoDelete = (event) => {
    const deletedCourses = AppStore.getDeletedCourses();

    if (
        deletedCourses.length > 0 &&
        (event == null ||
            (event.keyCode === 90 && (event.ctrlKey || event.metaKey)))
    ) {
        const lastDeleted = deletedCourses[deletedCourses.length - 1];

        if (lastDeleted !== undefined) {
            addCourse(
                lastDeleted.section,
                lastDeleted,
                lastDeleted.term,
                lastDeleted.scheduleIndex,
                lastDeleted.color
            );

            dispatcher.dispatch({
                type: 'UNDO_DELETE',
                deletedCourses: deletedCourses.slice(
                    0,
                    deletedCourses.length - 1
                ),
            });
        }
    }
    //TODO: Snackbar
};

export const changeCurrentSchedule = (direction) => {
    let newScheduleIndex;

    if (direction === 0)
        newScheduleIndex = (AppStore.getCurrentScheduleIndex() - 1 + 4) % 4;
    else if (direction === 1)
        newScheduleIndex = (AppStore.getCurrentScheduleIndex() + 1) % 4;

    dispatcher.dispatch({ type: 'CHANGE_CURRENT_SCHEDULE', newScheduleIndex });
};
