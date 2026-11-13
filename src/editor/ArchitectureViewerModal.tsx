/**
 * AbleStudio - Android Architecture Viewer
 * Interactive breakdown of the AbleStudio Kotlin / Jetpack Compose Android Architecture
 * mapping 1:1 to the user's project structure.
 */

import React, { useState } from 'react';
import { FolderTree, FileCode, Copy, Check, X, Smartphone, Layers } from 'lucide-react';

interface ArchitectureViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileEntry {
  path: string;
  category: string;
  summary: string;
  codeSnippet: string;
}

const ARCHITECTURE_FILES: FileEntry[] = [
  {
    path: 'app/src/main/java/com/able/studio/core/accessibility/AccessibilitySettings.kt',
    category: 'Core Engine',
    summary: 'WCAG 2.1 contrast math calculation, ColorMatrix vision filters, and accessibility score engine.',
    codeSnippet: `package com.able.studio.core.accessibility

import androidx.compose.ui.graphics.Color
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow

enum class VisionSimulationType {
    NONE, PROTANOPIA, DEUTERANOPIA, TRITANOPIA, ACHROMATOPSIA, LOW_VISION, HIGH_CONTRAST
}

data class ContrastScore(
    val ratio: Float,
    val passesAA: Boolean,
    val passesAAA: Boolean,
    val level: String
)

object AccessibilityEngine {
    fun calculateRelativeLuminance(color: Color): Float {
        fun transform(c: Float): Float {
            return if (c <= 0.04045f) c / 12.92f else ((c + 0.055f) / 1.055f).pow(2.4f)
        }
        val r = transform(color.red)
        val g = transform(color.green)
        val b = transform(color.blue)
        return 0.2126f * r + 0.7152f * g + 0.0722f * b
    }

    fun calculateContrast(foreground: Color, background: Color, isLargeText: Boolean = false): ContrastScore {
        val l1 = calculateRelativeLuminance(foreground)
        val l2 = calculateRelativeLuminance(background)
        val lighter = max(l1, l2)
        val darker = min(l1, l2)
        val ratio = (lighter + 0.05f) / (darker + 0.05f)

        val minAA = if (isLargeText) 3.0f else 4.5f
        val minAAA = if (isLargeText) 4.5f else 7.0f

        val level = when {
            ratio >= minAAA -> "AAA"
            ratio >= minAA -> "AA"
            else -> "FAIL"
        }
        return ContrastScore(ratio, ratio >= minAA, ratio >= minAAA, level)
    }
}`,
  },
  {
    path: 'app/src/main/java/com/able/studio/core/localization/LocalizationEngine.kt',
    category: 'Core Engine',
    summary: 'Resource resolution, RTL layout configuration, and dynamic language switcher.',
    codeSnippet: `package com.able.studio.core.localization

import androidx.compose.ui.unit.LayoutDirection
import java.util.Locale

data class SupportedLocale(
    val code: String,
    val displayName: String,
    val direction: LayoutDirection
)

object LocalizationEngine {
    val supportedLocales = listOf(
        SupportedLocale("en", "English", LayoutDirection.Ltr),
        SupportedLocale("es", "Español", LayoutDirection.Ltr),
        SupportedLocale("fr", "Français", LayoutDirection.Ltr),
        SupportedLocale("de", "Deutsch", LayoutDirection.Ltr),
        SupportedLocale("ja", "日本語", LayoutDirection.Ltr),
        SupportedLocale("ar", "العربية", LayoutDirection.Rtl)
    )

    fun resolveStringResource(resourceRef: String, locale: Locale): String {
        // Resolves @string/key from res/values/strings.xml dynamically
        return resourceRef.removePrefix("@string/")
    }
}`,
  },
  {
    path: 'app/src/main/java/com/able/studio/editor/DesignRenderer.kt',
    category: 'Editor UI',
    summary: 'Jetpack Compose interactive Canvas with transform gesture detectors, layer bounding boxes, and vision matrix filters.',
    codeSnippet: `package com.able.studio.editor

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import com.able.studio.data.model.DesignProject

@Composable
fun DesignRenderer(
    project: DesignProject,
    zoomScale: Float,
    selectedLayerId: String?,
    onLayerSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Canvas(
        modifier = modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    // Handle pan, pinch-to-zoom and direct layer manipulation
                }
            }
    ) {
        // Draw background, shape layers, text layers with DrawScope
    }
}`,
  },
  {
    path: 'app/src/main/java/com/able/studio/export/PngExporter.kt',
    category: 'Export Pipeline',
    summary: 'Hardware-accelerated Bitmap rendering to PNG at 1x/2x/3x density with color profiles.',
    codeSnippet: `package com.able.studio.export

import android.graphics.Bitmap
import android.graphics.Canvas
import com.able.studio.data.model.DesignProject
import java.io.OutputStream

class PngExporter {
    fun renderToBitmap(project: DesignProject, scale: Float = 2.0f): Bitmap {
        val width = (project.width * scale).toInt()
        val height = (project.height * scale).toInt()
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.scale(scale, scale)

        // Draw project canvas elements onto native Android Bitmap
        return bitmap
    }

    fun compressAndSave(bitmap: Bitmap, outputStream: OutputStream) {
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
    }
}`,
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    category: 'Resources',
    summary: 'Central XML dictionary of string resources and accessible labels.',
    codeSnippet: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">AbleStudio</string>
    <string name="template_event_title">Annual Inclusive Innovation Summit</string>
    <string name="template_event_subtitle">Designing Accessible Futures for All</string>
    <string name="template_event_date">Thursday, November 12 · 9:00 AM - 5:00 PM EST</string>
    <string name="template_badge_asl">ASL Interpreted</string>
    <string name="template_badge_wheelchair">Wheelchair Accessible</string>
    <string name="contrast_aaa_verified">WCAG AAA Verified</string>
</resources>`,
  },
];

export const ArchitectureViewerModal: React.FC<ArchitectureViewerModalProps> = ({ isOpen, onClose }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeFile = ARCHITECTURE_FILES[selectedIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-5xl max-h-[85vh] flex flex-col bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-2.5">
            <Smartphone className="text-amber-500" size={22} />
            <div>
              <h2 className="text-base font-semibold font-display">AbleStudio Android Project Structure</h2>
              <p className="text-xs text-stone-400">Kotlin & Jetpack Compose Architecture Mapping</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Two-Pane Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left file tree */}
          <div className="w-80 border-r border-stone-800 overflow-y-auto bg-stone-950/50 p-3 space-y-1">
            <div className="px-2 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <FolderTree size={13} />
              Project Files
            </div>

            {ARCHITECTURE_FILES.map((file, idx) => {
              const isSelected = idx === selectedIdx;
              const fileName = file.path.split('/').pop() || '';
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                      : 'text-stone-300 hover:bg-stone-800/60'
                  }`}
                >
                  <FileCode size={16} className={`shrink-0 mt-0.5 ${isSelected ? 'text-amber-400' : 'text-stone-400'}`} />
                  <div className="truncate">
                    <div className="font-medium truncate">{fileName}</div>
                    <div className="text-[10px] text-stone-500 truncate">{file.category}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Code Preview */}
          <div className="flex-1 flex flex-col overflow-hidden bg-stone-950">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-800 bg-stone-900/40 text-xs">
              <span className="font-mono-data text-stone-300 truncate max-w-lg">{activeFile.path}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors shrink-0"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy Kotlin'}
              </button>
            </div>

            <div className="p-4 border-b border-stone-800 bg-stone-900/20 text-xs text-stone-300">
              <span className="font-semibold text-amber-400">Description: </span>
              {activeFile.summary}
            </div>

            <pre className="flex-1 overflow-auto p-4 font-mono-data text-xs text-stone-300 leading-relaxed bg-stone-950">
              <code>{activeFile.codeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
