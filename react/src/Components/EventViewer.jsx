export default function EventDetails({ event }) {
    if (!event) {
        return (
            <div className="p-4 text-gray-500">
                Click on an event to see details
            </div>
        );
    }

    return (
        <div className="p-4 border rounded bg-white shadow w-80">
            <h2 className="text-lg font-bold mb-2">{event.title}</h2>
            <p><b>Start:</b> {event.start.toString()}</p>
            <p><b>End:</b> {event.end.toString()}</p>
            {event.resource && (
                <>
                    <p><b>Class:</b> {event.resource.class}</p>
                    <p><b>Location:</b> {event.resource.location}</p>
                    <p><b>Color:</b> {event.resource.color}</p>
                    <p><b>Creator:</b> {event.resource.creator_uuid}</p>
                </>
            )}
        </div>
    );
}