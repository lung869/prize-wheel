import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// 奖项配置 - 12格分布
const PRIZE_CONFIG = [
  { label: "一等奖", count: 2, color: "#FFD700" },
  { label: "二等奖", count: 3, color: "#C0C0C0" },
  { label: "三等奖", count: 4, color: "#87CEEB" },
  { label: "四等奖", count: 3, color: "#98FB98" }
];

// 随机打乱数组
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 构建转盘切片（随机排序）
function buildSlices() {
  const slices = [];
  PRIZE_CONFIG.forEach(prize => {
    for (let i = 0; i < prize.count; i++) {
      slices.push({
        label: prize.label,
        color: prize.color
      });
    }
  });
  return shuffleArray(slices);
}

// 转盘扇形组件
function WheelSlice({ slice, index, anglePerSlice }) {
  const startAngle = index * anglePerSlice;
  const endAngle = startAngle + anglePerSlice;
  const largeArc = anglePerSlice > 180 ? 1 : 0;
  const r = 90;
  
  const x1 = r * Math.cos((startAngle * Math.PI) / 180);
  const y1 = r * Math.sin((startAngle * Math.PI) / 180);
  const x2 = r * Math.cos((endAngle * Math.PI) / 180);
  const y2 = r * Math.sin((endAngle * Math.PI) / 180);
  
  const path = `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  
  // 文字位置
  const midAngle = (startAngle + endAngle) / 2;
  const textRadius = 60;
  const tx = textRadius * Math.cos((midAngle * Math.PI) / 180);
  const ty = textRadius * Math.sin((midAngle * Math.PI) / 180);

  return (
    <g>
      <path 
        d={path} 
        fill={slice.color} 
        stroke="#ffffff" 
        strokeWidth="1.5"
        className="transition-all duration-300 hover:opacity-90"
      />
      <text 
        x={tx} 
        y={ty} 
        fill="#1f2937" 
        fontSize="8" 
        fontWeight="bold"
        textAnchor="middle" 
        dominantBaseline="middle" 
        transform={`rotate(${midAngle + 90} ${tx} ${ty})`}
      >
        {slice.label}
      </text>
    </g>
  );
}

export default function PrizeWheel() {
  const [slices, setSlices] = useState([]);
  const [sliceCount, setSliceCount] = useState(0);
  const [anglePerSlice, setAnglePerSlice] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const wheelRef = useRef(null);

  // 初始化转盘
  useEffect(() => {
    const initialSlices = buildSlices();
    setSlices(initialSlices);
    setSliceCount(initialSlices.length);
    setAnglePerSlice(360 / initialSlices.length);
  }, []);

  // 从本地存储加载结果
  useEffect(() => {
    const stored = localStorage.getItem("prize_result");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setResult(parsed);
      } catch (e) {
        console.error("解析存储结果失败:", e);
      }
    }
  }, []);

  // 转盘旋转结束处理
  useEffect(() => {
    const el = wheelRef.current;
    if (!el || slices.length === 0) return;

    const onTransitionEnd = () => {
      setSpinning(false);
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      const pointerAngle = 0; // 指针在0度位置（顶部）
      const absAngleFrom0 = (pointerAngle - normalizedRotation + 360) % 360;
      const index = Math.floor(absAngleFrom0 / anglePerSlice) % sliceCount;
      const picked = slices[index];
      
      const resultObj = { 
        index, 
        prize: picked.label, 
        timestamp: Date.now()
      };
      
      setResult(resultObj);
      localStorage.setItem("prize_result", JSON.stringify(resultObj));
    };

    el.addEventListener("transitionend", onTransitionEnd);
    return () => el.removeEventListener("transitionend", onTransitionEnd);
  }, [rotation, anglePerSlice, sliceCount, slices]);

  // 获取指定奖项的随机索引
  const getRandomIndexForPrize = (prize) => {
    const indices = slices
      .map((slice, index) => slice.label === prize ? index : -1)
      .filter(index => index !== -1);
    return indices[Math.floor(Math.random() * indices.length)];
  };

  // 开始抽奖
  const handleSpin = () => {
    if (spinning || result || slices.length === 0) return;

    // 根据概率随机选择奖项
    const random = Math.random() * 100;
    let targetPrize;
    
    if (random < 15) { // 一等奖 15%
      targetPrize = "一等奖";
    } else if (random < 40) { // 二等奖 25%
      targetPrize = "二等奖";
    } else if (random < 70) { // 三等奖 30%
      targetPrize = "三等奖";
    } else { // 四等奖 30%
      targetPrize = "四等奖";
    }

    const targetIndex = getRandomIndexForPrize(targetPrize);
    const spins = 5; // 旋转圈数
    const sliceCenter = targetIndex * anglePerSlice + anglePerSlice / 2;
    const pointerAngle = 0; // 指针在顶部
    const finalRotation = spins * 360 + (360 - sliceCenter); // 调整计算方式
    
    // 添加随机偏移，增加真实感
    const fudge = (Math.random() - 0.5) * (anglePerSlice * 0.1);
    
    setSpinning(true);
    setRotation(prev => prev + finalRotation + fudge);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 转盘区域 */}
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="relative">
            {/* 指针 - 固定在顶部 */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 z-20">
              <div className="w-0 h-0 border-l-16 border-r-16 border-b-24 border-transparent border-b-red-600"></div>
              <div className="w-4 h-8 bg-red-600 -mt-1 mx-auto rounded-b-lg"></div>
            </div>
            
            {/* 转盘容器 */}
            <div className="relative w-80 h-80 md:w-96 md:h-96 mt-8">
              <div
                ref={wheelRef}
                className="w-full h-full rounded-full transition-transform duration-[5000ms] ease-out border-8 border-white shadow-2xl"
                style={{ 
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <g transform="translate(100 100)">
                    {slices.map((slice, index) => (
                      <WheelSlice
                        key={index}
                        slice={slice}
                        index={index}
                        anglePerSlice={anglePerSlice}
                      />
                    ))}
                    {/* 中心圆 */}
                    <circle r="20" fill="#ffffff" stroke="#e5e7eb" strokeWidth="3" />
                    <circle r="15" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <motion.button 
              onClick={handleSpin}
              disabled={spinning || !!result}
              className="px-8 py-4 rounded-full font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-purple-600 text-white relative overflow-hidden"
              whileHover={spinning || result ? {} : { scale: 1.05 }}
              whileTap={spinning || result ? {} : { scale: 0.95 }}
            >
              {result ? "已抽奖" : spinning ? "抽奖中..." : "开始抽奖"}
              {(spinning || result) && (
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.button>
          </div>

          <div className="text-sm text-gray-600 text-center">
            {result ? "您已完成抽奖，结果已保存" : "每个用户仅限抽取一次"}
          </div>
        </div>

        {/* 信息面板 */}
        <div className="space-y-6">
          {/* 奖项分布 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">奖项分布</h3>
            <div className="grid grid-cols-1 gap-3">
              {PRIZE_CONFIG.map((prize, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: prize.color }}
                    ></div>
                    <span className="font-medium">{prize.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{prize.count}格</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 抽奖结果 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-xl font-bold text-gray-800 mb-4">抽奖结果</h3>
            {result ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200"
              >
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">恭喜您获得</div>
                  <div className="text-3xl font-bold text-green-600 mb-2">{result.prize}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-lg">尚未抽奖</div>
                <div className="text-sm mt-2">点击开始抽奖按钮参与活动</div>
              </div>
            )}
          </div>

          {/* 活动规则 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-xl font-bold text-gray-800 mb-3">活动规则</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• 转盘共12格，奖项随机分布</li>
              <li>• 每个用户只能抽奖一次，结果自动保存</li>
              <li>• 抽奖结果以转盘指针指向为准</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}