import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

export default function Calculator() {
  const [loanPrice, setLoanPrice] = useState(4500000); 
  const [downPayment, setDownPayment] = useState(1500000); 
  const [interestRate, setInterestRate] = useState(14.5); 
  const [loanTerm, setLoanTerm] = useState(36); 
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  // Calculate monthly payments dynamically
  useEffect(() => {
    const principal = loanPrice - downPayment;
    if (principal <= 0) {
      setMonthlyPayment(0);
      return;
    }
    const monthlyRate = (interestRate / 100) / 12;
    if (monthlyRate === 0) {
      setMonthlyPayment(principal / loanTerm);
      return;
    }
    const pmt = (principal * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) / 
                (Math.pow(1 + monthlyRate, loanTerm) - 1);
    setMonthlyPayment(Math.round(pmt));
  }, [loanPrice, downPayment, interestRate, loanTerm]);

  return (
    <main className="flex-1 section-container flex flex-col gap-8 animate-fade-in text-left">
      <div>
        <span className="text-dim-10 font-bold text-amber-500 tracking-widest uppercase">Financing Hub</span>
        <h2 className="text-3xl font-display font-extrabold mt-1">Smart Loan Calculator</h2>
        <p className="text-neutral-400 text-sm mt-1 max-w-xl">
          Estimate your monthly payments dynamically based on interest rates, loan terms, and down payments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg-grid-cols-3 gap-12 items-center bg-panel border border-subtle p-8 rounded-2xl">
        <div className="lg-col-span-1">
          <h3 className="text-lg font-bold text-white mb-3">Down Payment & Terms</h3>
          <p className="text-neutral-400 text-xs leading-relaxed">
            Adjust inputs to find a financing configuration that fits your budget. Local commercial banks in Ethiopia offer competitive financing rates ranging between 13.5% and 18%.
          </p>
          <div className="mt-6 flex items-center gap-3 bg-semi-trans border border-subtle p-3 rounded-lg text-xs text-neutral-400">
            <Info className="w-5 h-5 text-amber-500 shrink-0" />
            <span>Financing calculations are estimates. Loan details should be confirmed with corresponding commercial banks.</span>
          </div>
        </div>

        <div className="lg-col-span-1 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-neutral-400">
              <span>Vehicle Price</span>
              <span className="text-white font-display">{(loanPrice / 1000000).toFixed(1)} M Br</span>
            </div>
            <input
              type="range"
              min={1000000}
              max={20000000}
              step={100000}
              value={loanPrice}
              onChange={(e) => setLoanPrice(Number(e.target.value))}
              className="w-full accent-amber-500 h-1 rounded-lg cursor-pointer bg-semi-trans"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-neutral-400">
              <span>Down Payment</span>
              <span className="text-white font-display">{(downPayment / 1000000).toFixed(1)} M Br</span>
            </div>
            <input
              type="range"
              min={200000}
              max={loanPrice - 100000}
              step={50000}
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              className="w-full accent-amber-500 h-1 rounded-lg cursor-pointer bg-semi-trans"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-neutral-400">
              <span>Interest Rate</span>
              <span className="text-white">{interestRate.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={8}
              max={22}
              step={0.5}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-amber-500 h-1 rounded-lg cursor-pointer bg-semi-trans"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Loan Term</span>
            <div className="grid grid-cols-4 gap-2">
              {[12, 24, 36, 48].map((months) => (
                <button
                  key={months}
                  onClick={() => setLoanTerm(months)}
                  className={`py-2 rounded font-bold text-xs uppercase transition-all ${
                    loanTerm === months 
                      ? 'bg-amber text-black scale-105' 
                      : 'bg-semi-trans border border-subtle text-neutral-300 hover:text-white'
                  }`}
                >
                  {months / 12} Yrs
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg-col-span-1 bg-card border border-subtle p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg min-h-[260px]">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Monthly Installment</span>
          <div className="my-5 flex flex-col items-center">
            <span className="text-3xl md-text-4xl font-black font-display text-amber-500">
              {monthlyPayment.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-neutral-400 mt-1 uppercase tracking-widest">ETB / Month</span>
          </div>
          <hr className="w-full border-subtle my-2" />
          <div className="text-[11px] text-neutral-500 leading-normal max-w-[200px]">
            Principal amount: <span className="text-white font-bold">{((loanPrice - downPayment) / 1000000).toFixed(2)} Million Br</span> over {loanTerm} installments.
          </div>
        </div>
      </div>
    </main>
  );
}
