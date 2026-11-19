import React, { useState } from "react";
import { motion } from "framer-motion";

export default function DressTypeSelection({
  gender,
  onBack,
  onSelect,
  measurementsData,
}) {
  const [hoveredType, setHoveredType] = useState(null);
  const types = Object.keys(measurementsData[gender] || {});

  // Define icons and colors for different dress types
  const getTypeConfig = (type) => {
    const configs = {
      'Shirt': { 
        icon: '👔', 
        gradient: 'bg-indigo-500 ',
        hoverGradient: 'bg-indigo-600 ',
        bgColor: 'bg-indigo-50 ',
        description: 'Formal & casual shirts'
      },
      'Dress': { 
        icon: '👗', 
        gradient: 'bg-purple-500 ',
        hoverGradient: 'bg-purple-600 ',
        bgColor: 'bg-purple-50 ',
        description: 'Elegant dresses'
      },
      'Suit': { 
        icon: '🤵', 
        gradient: 'bg-gray-600 ',
        hoverGradient: 'bg-gray-700 ',
        bgColor: 'bg-gray-50 ',
        description: 'Professional suits'
      },
      'Blouse': { 
        icon: '👚', 
        gradient: 'bg-rose-500 ',
        hoverGradient: 'bg-rose-600 ',
        bgColor: 'bg-rose-50 ',
        description: 'Stylish blouses'
      },
      'Kurta': { 
        icon: '🥻', 
        gradient: 'bg-orange-500 ',
        hoverGradient: 'bg-orange-600 ',
        bgColor: 'bg-orange-50 ',
        description: 'Traditional kurtas'
      },
      'T-Shirt': { 
        icon: '👕', 
        gradient: 'bg-green-500 ',
        hoverGradient: 'bg-green-600 ',
        bgColor: 'bg-green-50 ',
        description: 'Comfortable t-shirts'
      }
    };
    
    return configs[type] || {
      icon: '👔',
      gradient: 'bg-indigo-500 ',
      hoverGradient: 'bg-indigo-600 ',
      bgColor: 'bg-indigo-50 ',
      description: 'Custom garment'
    };
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-4 max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >

      {/* Dress Type Grid */}
      <motion.div 
        className="flex flex-wrap justify-center gap-3 w-full"
        variants={itemVariants}
      >
        {types.map((type, index) => {
          const config = getTypeConfig(type);
          return (
            <motion.button
              key={type}
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-500 p-4 min-h-[150px] w-full sm:w-[240px] ${
                hoveredType === type 
                  ? 'border-indigo-300 shadow-2xl shadow-indigo-500/20' 
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
              onMouseEnter={() => setHoveredType(type)}
              onMouseLeave={() => setHoveredType(null)}
              onClick={() => onSelect(type)}
              variants={itemVariants}
              whileHover={{ 
                y: -10, 
                scale: 1.03,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 ${config.bgColor} opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />
              
              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/15 rounded-full blur-lg group-hover:scale-125 transition-transform duration-500" />
              
              {/* Content */}
              <div className="relative flex flex-col items-center justify-center space-y-3 h-full text-center">
                {/* Icon */}
                <motion.div 
                  className={`p-4 rounded-xl ${config.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300`}
                  whileHover={{ 
                    rotate: [0, -10, 10, 0],
                    scale: 1.15 
                  }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-white text-4xl">
                    {config.icon}
                  </span>
                </motion.div>

                {/* Title & Description */}
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                    {type}
                  </h4>
                  <p className="text-sm text-gray-600 font-medium">
                    {config.description}
                  </p>
                </div>

                {/* Select Button */}
                <motion.div
                  className={`px-5 py-2 ${config.gradient} hover:${config.hoverGradient} text-white rounded-lg font-semibold shadow-md group-hover:shadow-lg transition-all duration-300 flex items-center space-x-2`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Select {type}</span>
                  <motion.div
                    animate={{ 
                      x: hoveredType === type ? 3 : 0
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    →
                  </motion.div>
                </motion.div>
              </div>

              {/* Animated Border */}
              <motion.div 
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: hoveredType === type ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          );
        })}
      </motion.div>

      {/* Back Button */}
      <motion.button
        onClick={onBack}
        className="group flex items-center gap-3 px-6 py-2 bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-gray-800 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 border-2 border-gray-200 hover:border-indigo-200"
        variants={itemVariants}
        whileHover={{ 
          scale: 1.05, 
          x: -5,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="text-xl"
          animate={{ x: 0 }}
          whileHover={{ x: -3 }}
          transition={{ duration: 0.2 }}
        >
          ←
        </motion.span>
        <span>Back to Gender Selection</span>
      </motion.button>

      {/* Footer Info */}
      <motion.div 
        className="text-center space-y-2 max-w-lg mx-auto"
        variants={itemVariants}
      >
        <p className="text-sm text-gray-500">
          Each garment is crafted with premium materials and precise measurements for the perfect fit
        </p>
      </motion.div>
    </motion.div>
  );
}
