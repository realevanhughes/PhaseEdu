import React, { useEffect, useState } from "react";

export default function Classes() {
    const [htmlContent, setHtmlContent] = React.useState(
        ""
    );

    useEffect(() => {
        fetch('/api/classes/list')
            .then(response => response.json())
        .then(json => {
            let classes_arr = json.list
            let add = ""
            for (let new_class of classes_arr) {
                let new_obj = `\n<li className='class'>\n<a href='/#/Classes/${new_class.id}'>${new_class.name}</a>\n</li>`
                add = add + new_obj;
            }
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