import { 
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';

import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

export default function StudentSummary() {
    let positivePoints = 80;
    let negativePoints = 3;
    let behaviourPercent = JSON.stringify(Math.round(positivePoints / (positivePoints + negativePoints) * 100)) + "%";
    let presents = 150;
    let absences = 3;
    let lates = 3;
    let attendancePercent = JSON.stringify(Math.round(presents / (presents + absences) * 100)) + "%";
    // Variables need to be made dynamic

    const attendanceData = {
        labels: ['Present', 'Absent'],
        datasets: [{
            data: [presents, absences],
            backgroundColor: [
                'rgba(65, 204, 0, 0.8)',
                'rgba(255, 0, 0, 0.5)',
            ],
            borderColor: ['rgba(113, 206, 70)', 'rgba(255, 0, 0, 0.6)']
        }]
    };

    const behaviourData = {
        labels: ['Positive', 'Negative'],
        datasets: [{
            data: [positivePoints, negativePoints],
            backgroundColor: [
                'rgba(65, 204, 0, 0.8)',
                'rgba(255, 0, 0, 0.5)',
            ],
            borderColor: ['rgba(113, 206, 70)', 'rgba(255, 0, 0, 0.6)']
        }]
    };

    const centerTextPlugin = (text) => ({
        id: 'centerTextPlugin',
        afterDraw: (chart) => {
            const { ctx, chartArea } = chart;
            ctx.save();
            const x = (chartArea.left + chartArea.right) / 2;
            const y = (chartArea.top + chartArea.bottom) / 2;
            ctx.font = 'bold 1.5em sans-serif';
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x, y);
            ctx.restore();
            }
    });

    const attendanceOptions = {
        cutout: '75%',
        plugins: [centerTextPlugin(attendancePercent)],
    };

    const behaviourOptions = {
        cutout: '75%',
        plugins: [centerTextPlugin(behaviourPercent)],
    };

    return (
        <section className="student-summary">
            <a href="#" className="h2"><h2>Behaviour</h2></a>
            <a href="#" className="h2"><h2>Attendance</h2></a>
            <div className="donught-chart" id="behaviour-chart">
                <Doughnut
                    data = {behaviourData}
                    options = {behaviourOptions}
                ></Doughnut>
            </div>
            <div className="donught-chart" id="attendance-chart">
                <Doughnut
                    data = {attendanceData}
                    options = {attendanceOptions}
                ></Doughnut>
            </div>
            <div className="points-summary">
                <p>Positive: {positivePoints}</p>
                <p>Negative: {negativePoints}</p>
            </div>
            <div className="points-summary">
                <p>Absences: {absences}</p>
                <p>Lates: {lates}</p>
            </div>
        </section>
    );
}