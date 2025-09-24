import React, { useEffect, useState } from "react";

export default function Classes() {
    let subjectName = "Computer Science";
    const [htmlContent, setHtmlContent] = React.useState(
        ""
    );

    useEffect(() => {
        fetch('/api/classes/list')
            .then(response => response.json())
        .then(json => {
            let classes_arr = json.list
            console.log(classes_arr)
            let add = ""
            for (let new_class of classes_arr) {
                console.log(new_class)
                let new_obj = `\n<li className='class'>\n<a href='/classes/${new_class.id}'>${new_class.name}</a>\n</li>`
                add = add + new_obj;
            }
            console.log(add);
            setHtmlContent(add);
        })
    }, []);

    return (
        <section className="classes">
            <a href="#" className="h2"><h2>Classes</h2></a>
            <ul className="classes-list" dangerouslySetInnerHTML={{ __html: htmlContent }}>
            </ul>
        </section>
    );
}