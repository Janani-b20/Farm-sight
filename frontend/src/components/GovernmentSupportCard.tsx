import React, { useEffect, useState } from 'react';
import { Landmark, ChevronDown, ChevronUp, ExternalLink, ShieldCheck, Info, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations } from '../i18n/translations';
import { getSchemeRecommendations, SchemeItem } from '../services/schemeApi';
import { getSchemeTranslation } from '../i18n/schemeTranslations';

interface GovernmentSupportCardProps {
  riskTags?: string[];
  onTopSchemeLoaded?: (scheme: SchemeItem | null) => void;
}

export const GovernmentSupportCard: React.FC<GovernmentSupportCardProps> = ({
  riskTags,
  onTopSchemeLoaded,
}) => {
  const { language, selectedCrop, location } = useApp();
  const t = translations[language];

  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getSchemeRecommendations({
      state: location.state || 'Tamil Nadu',
      crop: selectedCrop,
      risk_tags: riskTags || ['crop_loss', 'weather_risk'],
      top_n: 3,
    })
      .then((res) => {
        if (isMounted) {
          const list = res.schemes && res.schemes.length > 0 ? res.schemes : res.fallback_schemes || [];
          const top3 = list.slice(0, 3);
          setSchemes(top3);
          setDisclaimer(res.disclaimer || '');
          setLoading(false);
          if (onTopSchemeLoaded) {
            onTopSchemeLoaded(top3[0] || null);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load schemes:', err);
        if (isMounted) {
          setLoading(false);
          if (onTopSchemeLoaded) {
            onTopSchemeLoaded(null);
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [location.state, selectedCrop, JSON.stringify(riskTags), onTopSchemeLoaded]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-sage-200 shadow-card animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sage-100" />
          <div className="h-5 bg-sage-100 rounded w-48" />
        </div>
        <div className="h-20 bg-sage-50 rounded-2xl" />
      </div>
    );
  }

  if (schemes.length === 0) {
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpandedSchemeId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-sage-200 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E7EFE3] text-[#2F5436] flex items-center justify-center font-bold">
            <Landmark className="w-5 h-5 text-[#2F5436]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#1D2A20] tracking-tight">
              {t.governmentSupportTitle}
            </h3>
            <p className="text-xs text-[#6F786F] font-medium">
              {location.state || 'Tamil Nadu'} • {selectedCrop.toUpperCase()}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
          {schemes.length} {language === 'ta' ? 'திட்டங்கள்' : language === 'hi' ? 'योजनाएं' : 'Schemes'}
        </span>
      </div>

      {/* Scheme Cards (Max 3) */}
      <div className="space-y-3">
        {schemes.map((scheme) => {
          const isExpanded = expandedSchemeId === scheme.scheme_id;
          const loc = getSchemeTranslation(scheme.scheme_id, language, scheme);
          const mainReasons = loc.whyRecommended?.slice(0, 2) || [];

          return (
            <div
              key={scheme.scheme_id}
              className="bg-sage-50/50 rounded-2xl p-4 border border-sage-200 hover:border-sage-300 transition-all space-y-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm md:text-base font-bold text-[#1D2A20] leading-snug">
                    {scheme.scheme_name}
                  </h4>
                  {loc.benefit && (
                    <p className="text-xs text-[#3F4A42] mt-1 font-medium leading-relaxed">
                      {loc.benefit}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    scheme.relevance === 'Highly Relevant'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  {loc.relevance}
                </span>
              </div>

              {/* Reasons preview */}
              {mainReasons.length > 0 && (
                <div className="space-y-1 bg-white/70 rounded-xl p-2.5 border border-sage-100 text-xs text-[#3F4A42]">
                  {mainReasons.map((reason: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#416A47] shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* View Details button */}
              <div className="pt-1 flex items-center justify-between gap-2 border-t border-sage-200/60">
                <button
                  type="button"
                  onClick={() => toggleExpand(scheme.scheme_id)}
                  className="text-xs font-bold text-[#2F5436] hover:text-[#1D2A20] flex items-center gap-1.5 py-1 transition-colors"
                >
                  <span>{isExpanded ? t.hideDetails : t.viewDetails}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {scheme.official_url && (
                  <a
                    href={scheme.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#2F5436] hover:underline flex items-center gap-1"
                  >
                    <span>{t.checkOfficialPortal}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="pt-3 border-t border-sage-200 space-y-3 text-xs text-[#3F4A42]">
                  {loc.eligibilityNote && (
                    <div className="bg-white rounded-xl p-3 border border-sage-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#1D2A20]">
                        <Info className="w-3.5 h-3.5 text-[#2F5436]" />
                        <span>{t.eligibility}</span>
                      </div>
                      <p className="leading-relaxed text-[#3F4A42]">{loc.eligibilityNote}</p>
                    </div>
                  )}

                  {loc.documents && loc.documents.length > 0 && (
                    <div className="bg-white rounded-xl p-3 border border-sage-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-[#1D2A20]">
                        <FileText className="w-3.5 h-3.5 text-[#2F5436]" />
                        <span>{t.requiredDocuments}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[#3F4A42]">
                        {loc.documents.map((doc: string, dIdx: number) => (
                          <li key={dIdx}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {loc.whyRecommended && loc.whyRecommended.length > 2 && (
                    <div className="bg-white rounded-xl p-3 border border-sage-200 space-y-1">
                      <div className="font-bold text-[#1D2A20]">{t.whyRecommended}</div>
                      <ul className="space-y-1 text-[#3F4A42]">
                        {loc.whyRecommended.map((r: string, rIdx: number) => (
                          <li key={rIdx} className="flex items-start gap-1.5">
                            <span className="text-[#2F5436] font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scheme.official_url && (
                    <div className="pt-2">
                      <a
                        href={scheme.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#2F5436] hover:bg-[#234029] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all min-h-[40px] text-xs"
                      >
                        <span>{t.checkOfficialPortal}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Backend Disclaimer */}
      {disclaimer && (
        <p className="text-[11px] text-[#6F786F] italic leading-relaxed pt-1">
          * {disclaimer}
        </p>
      )}
    </div>
  );
};
