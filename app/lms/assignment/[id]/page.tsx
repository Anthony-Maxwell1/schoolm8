// app/lms/assignment/[id]/page.tsx

import { css } from "@/lib/css";

export type Data = {
    id: string;
    title: string;
    description: string;
    courseId: string;
    courseName: string;
    dueAt?: Date;
    created?: Date;
    url?: string;
    source: "canvas" | "classroom" | "moodle";
    rubric?: Record<string, string[]>;
};

const data: Data = {
    title: "Hello!",
    id: "123",
    description: "this is a description",
    courseName: "Testing",
    courseId: "123",
    created: new Date(),
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    url: "https://test.com",
    source: "classroom",
};

function getMaxRows(obj: Record<string, any[]>) {
    return Math.max(...Object.values(obj).map((arr) => arr.length));
}

export default async function Assignment({ params }: { params: { id: string } }) {
    const { id } = await params;

    const style = css.app.lms.assignment;

    const headers = data.rubric && Object.keys(data.rubric);
    const maxRows = data.rubric && getMaxRows(data.rubric);

    return (
        <div className={style.main["ROOT-STYLE"]}>
            {/* Header Card */}
            <div className={style.header.card["ROOT-STYLE"]}>
                <p className={style.header.meta["ROOT-STYLE"]}>
                    {id} •{" "}
                    {(data.source == "classroom" && "Google Classroom") ||
                        (data.source == "canvas" && "Canvas") ||
                        (data.source == "moodle" && "Moodle")}
                </p>

                <h1 className={style.header.title["ROOT-STYLE"]}>{data.title}</h1>

                <p className={style.header.course["ROOT-STYLE"]}>{data.courseName}</p>

                <div className={style.header.dates["ROOT-STYLE"]}>
                    {data.created && <span>Created: {data.created.toLocaleDateString()}</span>}
                    {data.dueAt && (
                        <span className={style.header.due["ROOT-STYLE"]}>
                            Due: {data.dueAt.toLocaleDateString()}
                        </span>
                    )}
                </div>

                <p className={style.header.desc["ROOT-STYLE"]}>{data.description}</p>

                {data.url && (
                    <a href={data.url} target="_blank" className={style.header.link["ROOT-STYLE"]}>
                        Open Resource →
                    </a>
                )}
            </div>

            {/* Rubric */}
            {data.rubric && headers && maxRows && (
                <div className={style.rubric.card["ROOT-STYLE"]}>
                    <h2 className={style.rubric.title["ROOT-STYLE"]}>
                        {style.rubric.title.CONTENT}
                    </h2>

                    <div className={style.rubric.tableWrapper["ROOT-STYLE"]}>
                        <table className={style.rubric.table["ROOT-STYLE"]}>
                            <thead>
                                <tr>
                                    {headers.map((h) => (
                                        <th
                                            key={h}
                                            className={style.rubric.table.header["ROOT-STYLE"]}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {Array.from({ length: maxRows }).map((_, row) => (
                                    <tr key={row}>
                                        {headers.map((h) => (
                                            <td
                                                key={h}
                                                className={style.rubric.table.cell["ROOT-STYLE"]}
                                            >
                                                {data.rubric![h][row] ?? ""}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
