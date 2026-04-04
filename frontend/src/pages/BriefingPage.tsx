import { useNavigate } from "react-router-dom";
import { useBriefing } from "../hooks/useBriefing";
import CardStack from "../components/CardStack";
import FeedbackButtons from "../components/FeedbackButtons";
import EmptyState from "../components/EmptyState";
import { useState, useEffect } from "react";

interface BriefingPageProps {
  onReviewComplete?: () => void;
}

function ConfettiEffect() {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      color: [
        "bg-primary",
        "bg-secondary",
        "bg-emerald-400",
        "bg-pink-400",
        "bg-cyan-400",
        "bg-violet-400",
      ][Math.floor(Math.random() * 6)],
      size: 4 + Math.random() * 6,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-sm ${p.color}`}
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-4 pt-6">
      <div className="relative w-full" style={{ height: "420px" }}>
        <div className="absolute inset-0 bg-white/5 rounded-2xl animate-pulse" />
      </div>
      <div className="flex items-center justify-center gap-6 py-4 mt-4">
        <div className="w-14 h-14 rounded-full bg-white/5 animate-pulse" />
        <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
        <div className="w-14 h-14 rounded-full bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

export default function BriefingPage({ onReviewComplete }: BriefingPageProps) {
  const navigate = useNavigate();
  const {
    briefing,
    loading,
    error,
    remainingCards,
    isComplete,
    reviewedCount,
    totalCards,
    generate,
    sendFeedback,
  } = useBriefing();

  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isComplete && totalCards > 0) {
      setShowConfetti(true);
      onReviewComplete?.();
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, totalCards, onReviewComplete]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        message={error}
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (!briefing) {
    return (
      <div className="px-4 pt-6">
        <EmptyState
          icon="📰"
          message="No briefing yet for today. Set up your categories and generate your first briefing!"
          actionLabel="Set Up Categories"
          onAction={() => navigate("/categories")}
        />
        <div className="flex justify-center mt-2">
          <button
            onClick={generate}
            className="px-6 h-11 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/15 active:scale-[0.97] transition-all"
          >
            Generate Briefing
          </button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="px-4 pt-6">
        {showConfetti && <ConfettiEffect />}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">All Done!</h2>
          <p className="text-gray-400 text-sm mb-2">
            You reviewed {totalCards} card{totalCards !== 1 ? "s" : ""} today.
          </p>
          <p className="text-gray-500 text-xs mb-8">
            Come back tomorrow for your next briefing.
          </p>
          <button
            onClick={generate}
            className="px-6 h-11 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/15 active:scale-[0.97] transition-all"
          >
            Generate New Briefing
          </button>
        </div>
      </div>
    );
  }

  const handleSwipe = (cardId: string, gesture: unknown) => {
    const feedbackMap: Record<string, "thumbs_up" | "thumbs_down" | "skip"> = {
      thumbs_up: "thumbs_up",
      thumbs_down: "thumbs_down",
      skip: "skip",
    };
    const fb = feedbackMap[gesture as string] ?? "skip";
    sendFeedback(cardId, fb);
  };

  const handleThumbsUp = () => {
    if (remainingCards.length > 0) {
      sendFeedback(remainingCards[0].id, "thumbs_up");
    }
  };

  const handleThumbsDown = () => {
    if (remainingCards.length > 0) {
      sendFeedback(remainingCards[0].id, "thumbs_down");
    }
  };

  const handleSkip = () => {
    if (remainingCards.length > 0) {
      sendFeedback(remainingCards[0].id, "skip");
    }
  };

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-500">
          {reviewedCount} / {totalCards} reviewed
        </span>
        <div className="flex-1 mx-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{
              width: `${totalCards > 0 ? (reviewedCount / totalCards) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <CardStack cards={remainingCards} onSwipe={handleSwipe} />

      <FeedbackButtons
        onThumbsUp={handleThumbsUp}
        onThumbsDown={handleThumbsDown}
        onSkip={handleSkip}
        disabled={remainingCards.length === 0}
      />

      <p className="text-center text-[11px] text-gray-600 mt-1">
        Swipe right to like, left to dislike, up to skip
      </p>
    </div>
  );
}
