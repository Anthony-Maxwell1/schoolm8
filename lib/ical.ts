import ICAL from "ical.js";

export function parseICalData(icalData: string) {
  try {
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const events = comp.getAllSubcomponents("vevent").map((vevent) => {
      const event = new ICAL.Event(vevent);
      return {
        uid: event.uid,
        summary: event.summary,
        description: event.description,
        location: event.location,
        startDate: event.startDate.toJSDate(),
        endDate: event.endDate.toJSDate(),
      };
    });
    return events;
  } catch (error) {
    console.error("Failed to parse iCal data:", error);
    throw new Error("Invalid iCal data");
  }
}