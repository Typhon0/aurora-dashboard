import React, { useEffect, useState, useRef } from "react";
import { AuroraCard } from "./base/AuroraCard";
import { cn } from "../../lib/utils";

interface Props {
  className?: string;
}

export function AuroraTimeCard({ className }: Props) {
  const [date, setDate] = useState(new Date());
  const requestRef = useRef<number>();

  const animate = () => {
    setDate(new Date());
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Time components
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();

  // Smooth rotation for hands
  // Hours: 360 deg / 12 hours = 30 deg/hour. + (minutes / 60) * 30
  const hourDeg = (hours % 12) * 30 + (minutes / 60) * 30;
  // Minutes: 360 deg / 60 minutes = 6 deg/minute. + (seconds / 60) * 6
  const minuteDeg = minutes * 6 + (seconds / 60) * 6;
  // Seconds: 360 deg / 60 seconds = 6 deg/second.
  // For smooth sweep: + (ms / 1000) * 6
  const secondDeg = seconds * 6 + (milliseconds / 1000) * 6;

  // Digital Time Format
  const timeString = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  // Date Format
  const dayName = date.toLocaleDateString("fr-FR", { weekday: "long" });
  const dateString = date.toLocaleDateString("fr-FR", { 
    day: "numeric", 
    month: "long" 
  });

  return (
    <AuroraCard className={cn("flex flex-col justify-center overflow-hidden relative h-full", className)}>
      {/* Background Glow Effect */}
      <div className="absolute top-[-50%] right-[-20%] w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-50%] left-[-20%] w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between gap-6 px-2 relative z-10">
        
        {/* Digital Side */}
        <div className="flex flex-col justify-center">
          <div className="text-[5rem] leading-[0.9] font-extralight tracking-tighter text-white tabular-nums">
            {timeString}
          </div>
          <div className="flex flex-col mt-2">
             <div className="text-xl font-medium text-white capitalize">
              {dayName}
            </div>
            <div className="text-sm text-white/60 uppercase tracking-widest font-medium">
              {dateString}
            </div>
          </div>
        </div>

        {/* Analog Side (Hidden on very small screens if needed, but fits in standard col-span-2) */}
        <div className="hidden sm:block relative w-32 h-32 shrink-0">
           {/* Clock Face */}
           <div className="absolute inset-0 rounded-full border-2 border-white/10 bg-white/5 backdrop-blur-sm shadow-inner" />
           
           {/* Hour Markers */}
           {Array.from({ length: 12 }).map((_, i) => (
             <div
               key={i}
               className={cn(
                 "absolute w-0.5 bg-white/40 left-1/2 top-0 origin-bottom",
                 i % 3 === 0 ? "h-3 w-1 bg-white/80" : "h-2"
               )}
               style={{
                 height: "50%", // Pivot from center
                 transform: `rotate(${i * 30}deg)`,
               }}
             >
                {/* The actual marker is just the top tip */}
                <div className={cn(
                    "w-full mx-auto mt-1 rounded-full", 
                    i % 3 === 0 ? "h-2.5" : "h-1.5"
                )} />
             </div>
           ))}

           {/* Hands Container - Centered */}
           <div className="absolute inset-0 flex items-center justify-center">
             
             {/* Hour Hand */}
             <div 
                className="absolute w-1.5 h-16 bg-white rounded-full origin-bottom shadow-lg"
                style={{ 
                    height: "25%", 
                    bottom: "50%", 
                    transform: `rotate(${hourDeg}deg)`,
                    transformOrigin: "bottom center" 
                }} 
             />

             {/* Minute Hand */}
             <div 
                className="absolute w-1 h-24 bg-white/90 rounded-full origin-bottom shadow-lg"
                style={{ 
                    height: "38%", 
                    bottom: "50%", 
                    transform: `rotate(${minuteDeg}deg)`,
                    transformOrigin: "bottom center" 
                }} 
             />

             {/* Second Hand */}
             <div 
                className="absolute w-0.5 h-24 bg-orange-500 rounded-full origin-bottom shadow-sm"
                style={{ 
                    height: "45%", 
                    bottom: "50%", 
                    transform: `rotate(${secondDeg}deg)`,
                    transformOrigin: "bottom center" 
                }} 
             >
                {/* Counter weight */}
                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-1 h-3 bg-orange-500 rounded-full" />
             </div>

             {/* Center Dot */}
             <div className="absolute w-2 h-2 bg-white rounded-full border-2 border-orange-500 z-10 shadow-md" />
           </div>
        </div>
      </div>
    </AuroraCard>
  );
}
