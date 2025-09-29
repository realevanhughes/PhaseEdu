import { useParams } from "react-router-dom";
import React, {useEffect, useState} from "react";

export default function ClassPage() {
    const {cid} = useParams();

    const [classInfo, setClassInfo] = useState(null);

    useEffect(() => {
        fetch(`/api/classes/${cid}/info`)
            .then((response) => {
                return response.json();
            })
            .then((json) => {
                setClassInfo(json.contents);
            })
    }, [cid]);


    if (classInfo === null) {
        return(
            <>
                <div className="page-layout">
                    <main className="main-content">
                        <div className="p-6">Loading class info...</div>
                    </main>
                </div>
            </>
        )
    }
    else {
        return(
            <>
                <div className="page-layout">
                    <main className="main-content">
                        <div>
                            <h1 className="text-2xl font-bold">{classInfo.name}</h1>
                            <p1>{classInfo.subject}</p1>
                        </div>
                    </main>
                </div>
            </>
        )
    }
}

