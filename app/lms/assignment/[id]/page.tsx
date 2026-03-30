// app/lms/assignment/[id]/page.tsx

type Data = {
    title: string;
    desc: string;
    rubric: Record<string, Array<string>>;
    course: string;
    created?: Date;
    due?: Date;
    link?: string;
    source?: string;
};

const data: Data = {
    title: "Hello!",
    desc: "this is a description",
    rubric: {
        "Section 1": ["1 Point", "2 Points", "3 Points"],
        "Section 2": ["1 Point", "2 Points"],
    },
    course: "Testing",
    created: new Date(),
    link: "https://test.com",
    source: "classroom",
};

function getLengthOfLargestList(jsonObject: Record<any, Array<any>>) {
    let maxLength = 0;
    let biggest: Array<any> = [];

    // Iterate over the object's properties using Object.values()
    Object.values(jsonObject).forEach((value) => {
        // Check if the property value is an array
        // Update maxLength if the current array's length is greater
        if (value.length > maxLength) {
            maxLength = value.length;
            biggest = value;
        }
    });

    return biggest;
}

export default async function Post({ params }: { params: { id: string } }) {
    const { id } = await params;

    return (
        <div>
            <p>
                {id} -{" "}
                {(data.source == "classroom" && "Google Classroom") ||
                    (data.source == "canvas" && "Canvas") ||
                    (data.source == "moodle" && "Moodle")}{" "}
                - Created: {data.created?.toDateString()}{" "}
                {data.created?.toTimeString().split(" ")[0]}
            </p>
            <h3>
                {data.course} - Due: {data.due?.toDateString()} {data.due?.toTimeString()}
            </h3>
            <h2>{data.title}</h2>
            <p>{data.desc}</p>
            <table>{/* <tr>{data.rubric && data.rubric.forEach(element -> {})}</tr> */}</table>
        </div>
    );
}
