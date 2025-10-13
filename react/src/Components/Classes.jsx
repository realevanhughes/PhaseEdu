import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
                let new_obj = `\n<li class='class'>\n<a href='/#/Classes/${new_class.id}'>${new_class.name}</a>\n</li>`
                add = add + new_obj;
            }
            setHtmlContent(add);
        })
    }, []);

    return (
        <section className="classes">
            <Link to="/Classes" className="h2"><h2>Classes</h2></Link>
            <ul className="classes-list" dangerouslySetInnerHTML={{ __html: htmlContent }}>
            </ul>
        </section>
    );
}