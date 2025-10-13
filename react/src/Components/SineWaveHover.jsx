import React, { useRef, useEffect, useState } from "react";
import logo from "../assets/waves800.png";

const SineWaveHover = ({ staticImageSrc, width = 48, height = 48 }) => {
    const canvasRef = useRef(null);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        if (!hovered) return; // only animate on hover

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let animationFrameId;
        const amplitude = 11;
        const frequency = 4; // increased frequency → peaks closer together
        let phase = 0;

        const drawWave = (color, phaseOffset) => {
            ctx.beginPath();
            for (let x = 0; x <= width; x++) {
                const y =
                    height / 2 +
                    amplitude * Math.sin(frequency * (x / 20) + phase + phaseOffset);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            drawWave("blue", 0);
            drawWave("red", Math.PI / 2);
            phase += 0.05; // slower animation
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => cancelAnimationFrame(animationFrameId);
    }, [hovered, width, height]);

    return (
        <div
            style={{ position: "relative", width, height, display: "inline-block" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <img
                src={logo}
                alt="Static"
                style={{
                    width: "100%",
                    height: "100%",
                    display: hovered ? "none" : "block",
                }}
            />
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: hovered ? "block" : "none",
                    pointerEvents: "none",
                }}
            />
        </div>
    );
};

export default SineWaveHover;
