# Questions that need a human look

Flagged = hidden from practice until fixed. A question is live only when a blind solver agreed with its answer key.
Fix by editing the question's JSON in corpus/questions/ (stem/options/answer/status) and redeploying.

| Question | Status | Why | Source | Key | Checker |
|---|---|---|---|---|---|
| examon-kcet-che-wave3-03-012 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__chemistry.json p.0 |  | NCERT convention: 3d melting curve peaks at Cr (3d5 4s1, maximum unpaired d-electrons); V 2183 K vs Cr 2180 K is tabulation noise. |
| examon-kcet-phy-hard-101 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-02.json p.0 |  | Balance near known R: R/X=l/(100-l)=25/75, so X=4*75/25=12 ohm; examon's 1.33 ohm inverts the ratio. |
| examon-kcet-phy-hard-102 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-02.json p.0 |  | X=R(100-l)/l=6*70/30=14 ohm; examon's keyed 2.57 ohm comes from the inverted ratio l/(100-l). |
| examon-kcet-phy-hard-103 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-02.json p.0 |  | X=R(100-l)/l=8*65/35=14.86 ohm; examon's keyed 4.31 ohm comes from the inverted ratio l/(100-l). |
| examon-kcet-phy-hard-104 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-02.json p.0 |  | X=R(100-l)/l=10*60/40=15 ohm; examon's keyed 6.67 ohm comes from the inverted ratio l/(100-l). |
| examon-kcet-phy-hard-105 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-02.json p.0 |  | X=R(100-l)/l=4*55/45=4.89 ohm; examon's own solution derives 4.89 but its key 3.27 uses the inverted ratio. |
| examon-kcet-phy-hard-106 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-02.json p.0 |  |  |
| examon-kcet-phy-hard-107 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-02.json p.0 |  | Balance gives R/X = l/(100-l), so X = 8*45/55 = 6.55 ohm (option A). Examon's key used the inverted length ratio. |
| examon-kcet-phy-hard-108 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-02.json p.0 |  | X = R(100-l)/l = 10*40/60 = 6.67 ohm (option B). Examon's own solution agrees; its key 15 ohm inverted the ratio. |
| examon-kcet-phy-hard-109 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-02.json p.0 |  | X = 4*(100-65)/65 = 140/65 = 2.15 ohm (option B); Examon's key 7.43 ohm inverted l/(100-l). |
| examon-kcet-phy-hard-110 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-02.json p.0 |  | X = 6*(100-70)/70 = 180/70 = 2.57 ohm (option C); Examon's key 14 ohm inverts the length ratio. |
| examon-kcet-phy-hard-201 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-03.json p.0 |  | X = 6*(100-27)/27 = 438/27 = 16.22 ohm (option C); Examon's key 2.22 ohm inverted the length ratio. |
| examon-kcet-phy-hard-202 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-03.json p.0 |  | Meter bridge: R/X = l/(100-l) with l from the known-resistance end, so X = 8*68/32 = 17 ohm (B). Examon inverted the length ratio. |
| examon-kcet-phy-hard-203 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-03.json p.0 |  | X = R(100-l)/l = 10*63/37 = 17.03 ohm (B). Examon's published solution says 17.03 too; its key 5.87 inverted the ratio. |
| examon-kcet-phy-hard-204 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-03.json p.0 |  | X = 4*(100-42)/42 = 5.52 ohm (D); Examon's key 2.9 came from R*l/(100-l), the inverted ratio. |
| examon-kcet-phy-hard-205 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-03.json p.0 |  | X = 6*53/47 = 6.77 ohm (B). Examon's own written solution gets 6.77; its keyed 5.32 inverted l/(100-l). |
| examon-kcet-phy-hard-206 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-03.json p.0 |  | X = 8*(100-52)/52 = 7.38 ohm (A); examon's solution agrees, its key 8.67 inverted the length ratio. |
| examon-kcet-phy-hard-207 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-03.json p.0 |  | X = 10*(100-57)/57 = 7.54 ohm (C); examon's published solution says 7.54, keyed 13.26 inverted the ratio. |
| examon-kcet-phy-hard-208 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-03.json p.0 |  | X = 4*(100-62)/62 = 2.45 ohm (D); examon's solution gives 2.45, keyed 6.53 inverted the length ratio. |
| examon-kcet-phy-hard-209 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-03.json p.0 |  | X = 6*(100-67)/67 = 2.96 ohm (B); examon's solution derives 2.96, keyed 12.18 inverted the length ratio. |
| examon-kcet-phy-hard-210 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-hard-batch-03.json p.0 |  | X = 8*(100-72)/72 = 3.11 ohm (D); examon's solution derives 3.11, keyed 20.57 inverted the length ratio. |
| examon-kcet-phy-vhard-021 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-very-hard-batch.json p.0 |  | Axial short dipole: E/V = (2kp/r^3)/(kp/r^2) = 2/r = 2/0.2 = 10 m^-1, option D. Key's 1000 is an arithmetic slip. |
| examon-kcet-phy-vhard-025 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-very-hard-batch.json p.0 |  | E/V = 2/r = 2/0.2 = 10 m^-1, option C. Key's 1000 comes from evaluating 2/0.2 as 1000. |
| examon-kcet-phy-vhard-029 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-very-hard-batch.json p.0 |  | E/V = 2/r = 2/0.2 = 10 m^-1, option D; key's 1000 results from a factor-100 slip in evaluating 2/0.2. |
| examon-kcet-phy-vhard-121 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-very-hard-batch-02.json p.0 |  | E/V = 2/r = 2/0.2 = 10 m^-1, option D. Examon's 1000 treats r as 0.2 cm instead of 0.2 m. |
| examon-kcet-phy-vhard-125 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-very-hard-batch-02.json p.0 |  |  |
| examon-kcet-phy-vhard-129 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-very-hard-batch-02.json p.0 |  |  |
| examon-kcet-phy-vhard-130 | flagged | examon key was wrong; corrected answer available | sources/manual/bank/raw/exams__kcet__physics-very-hard-batch-02.json p.0 |  |  |
| pyq-2008-chemistry-116 | flagged | blind solver and key disagree | sources/pyq/2008/chemistry/2008-chemistry-question_paper-A1-indcareer.pdf p.13 | 2 | Key cell re-read as 2 (confirmed on image) and transcription exact, but insulin has 3 disulphide linkages (2 inter-chain, 1 intra-chain in A), so option 3; key appears wrong. |
| pyq-2009-chemistry-022 | flagged | blind solver and key disagree | sources/pyq/2009/chemistry/2009-chemistry-question_paper-A1-aglasem.pdf p.6 | B | Key cell A1 Q22 read correctly as 2 (800-1000 C); transcription exact. Standard textbook: slag formation zone is 1200-1500 C, 800-1000 C is lower reduction zone; some sources differ, so key may follow a different textbook. |
| pyq-2010-physics-003 | flagged | blind solver and key disagree | sources/pyq/2010/physics/2010-physics-question_paper-A1-aglasem.pdf p.2 | 3 | Key cell (A1 Q3 = 3, both a and b) re-read correctly; transcription matches. Relative to the table the ball stays put without friction (a) and is dragged slightly forward with friction, so b (moves left) is false; only a) is physically correct. |
| pyq-2010-physics-033 | flagged | blind solver and key disagree | sources/pyq/2010/physics/2010-physics-question_paper-A1-aglasem.pdf p.8 | 4 | Key cell (A1 Q33 = 4, i.e. 17) re-read correctly; transcription matches. d=5 um, d/lambda=8 so n=8 falls at 90 deg and is not observable; maxima n=0,+-1..+-7 = 15. Key apparently counted n=+-8. |
| pyq-2014-mathematics-055 | flagged | blind solver and key disagree | sources/pyq/2014/mathematics/2014-mathematics-question_paper-A1-aglasem.pdf p.14 | 3 | Key cell A1=3 read correctly (option -1/3). Slope at (1,2) is 3, so the angle with the y axis has tan = 1/3 (acute); -1/3 would need the obtuse angle. Transcription verified against image. |
| pyq-2015-chemistry-002 | flagged | blind solver and key disagree | sources/pyq/2015/chemistry/2015-chemistry-question_paper-A1-kea-wayback.pdf p.2 | 1 | Key cell reads 1 (confirmed). On charging, PbSO4 at the anode (positive plate) is oxidized to PbO2; option 1 (anode reduced to Pb) is chemically wrong. |
| pyq-2015-chemistry-013 | flagged | blind solver and key disagree | sources/pyq/2015/chemistry/2015-chemistry-question_paper-A1-kea-wayback.pdf p.4 | 1 | Key cell reads 1 (confirmed). Cu has LESS affinity for O than S (Cu2S stays while FeS oxidises); option 1 states the reverse, so key looks wrong; option 3 is correct. |
| pyq-2015-physics-003 | flagged | blind solver and key disagree | sources/pyq/2015/physics/2015-physics-question_paper-A1-aglasem.pdf p.2 | 1 | Transcription exact. R=2H gives tan(theta)=2, R=4v^2/5g (option 3); key option 1 (v^2/g) is the max range, which would need R=4H. Key read correctly in both key files. |
| pyq-2015-physics-015 | flagged | blind solver and key disagree | sources/pyq/2015/physics/2015-physics-question_paper-A1-aglasem.pdf p.5 | 1 | Key option 1 (4 and 3) counts the two end nodes; strictly between the ends the 3rd harmonic has 2 nodes and 3 antinodes (option 4). Key read correctly; transcription exact. |
| pyq-2015-physics-027 | flagged | blind solver and key disagree | sources/pyq/2015/physics/2015-physics-question_paper-A1-aglasem.pdf p.8 | 2 | I took R0 at 100C giving 300C; but with alpha defined from 0C, R100=100 gives R0=66.7 and R=200 at 400C, matching the key. Ambiguous wording; official key stands. |
| pyq-2015-physics-030 | flagged | blind solver and key disagree | sources/pyq/2015/physics/2015-physics-question_paper-A1-aglasem.pdf p.9 | 4 | Key option 4 (both positive and negative). Standard textbook answer is only positively charged particles, though negative ions can in principle be accelerated. Key read correctly in both files; transcription exact. |
| pyq-2016-chemistry-036 | flagged | blind solver and key disagree | sources/pyq/2016/chemistry/2016-chemistry-question_paper-A1-educationobserver.pdf p.10 | 4 | Transcription correct. [Co(AA)a2b2] has 3 geometrical isomers, one chiral, so 4 stereoisomers total; key's 'Four' counts optical isomers and is chemically valid. |
| pyq-2017-chemistry-007 | flagged | blind solver and key disagree | sources/pyq/2017/chemistry/2017-chemistry-question_paper-C-aglasem.pdf p.3 | B | Key reading confirmed (B). Transcription exact. Rate follows Arrhenius (rises with T); signs of dH/dS give no basis for rate to rise on cooling, so key B looks wrong. |
| pyq-2017-chemistry-010 | flagged | blind solver and key disagree | sources/pyq/2017/chemistry/2017-chemistry-question_paper-C-aglasem.pdf p.4 | B | Key reading confirmed (B). Transcription exact (printed ClO- on both sides). Cl goes +1 to -1 and +1 (printed as ClO-): disproportionation (C); key B Reduction looks wrong. |
| pyq-2018-chemistry-031 | flagged | blind solver and key disagree | sources/pyq/2018/chemistry/2018-chemistry-question_paper-A-aglasem.pdf p.13 | C | Key cell (col A) reads 3 = (C) 6 correctly; but fcc corner is shared by 8 cells and face by 2, so 6 has no clear basis; question is ill-posed. |
| pyq-2019-physics-004 | flagged | blind solver and key disagree | sources/pyq/2019/physics/2019-physics-question_paper-A1-aglasem.pdf p.3 | 3 | Transcription exact; key image A1 Q4 = 3 (C). Thermal agitation at room temperature means domains only partially aligned; my first pick (D) was too idealised. |
| pyq-2019-physics-034 | flagged | blind solver and key disagree | sources/pyq/2019/physics/2019-physics-question_paper-A1-aglasem.pdf p.17 | 2 | Key image A1 Q34 = 2 (B, -0.50) read correctly; transcription exact. Constant-volume wire gives Poisson ratio +0.5, and -0.5 is unphysical for this case, so the official key looks wrong. |
| pyq-2021-physics-035 | flagged | blind solver and key disagree | sources/pyq/2021/physics/2021-physics-question_paper-A1-aglasem.pdf p.17 | 3 | Key cell (A1, Q35) reads 3 = option C (concentric circles), read correctly; transcription is fine (options are images). Concentric circles cannot be a static electric field (non-conservative), whereas the dipole loop pattern D is valid for both electric and magnetic dipoles, so D looks correct. |
| pyq-2022-mathematics-057 | flagged | blind solver and key disagree | sources/pyq/2022/mathematics/2022-mathematics-question_paper-D3-collegedekho.pdf p.8 | 1 | Key cell (row 57, D3) re-read as 1 = option 31 (official KEA, likely excluding empty set). Question transcription verified. Odd numbers {1,3,5,7,9} give 2^5=32 subsets incl. the empty set (vacuously only odd); the D3 paper's own solution also says 32, so key looks wrong/arguable. |
| pyq-2023-chemistry-055 | flagged | blind solver and key disagree | sources/pyq/2023/chemistry/2023-chemistry-question_paper-B2-collegedekho.pdf p.10 | 2 | Key B2 cell reads 2 (Cr>Mn) confirmed; but NCERT mp values (V 2183 K > Cr 2180 K) also make A true, so two options are defensible; key choice B may rest on other data (Cr 1907 C > V 1890 C). |
| pyq-2023-physics-052 | flagged | blind solver and key disagree | sources/pyq/2023/physics/2023-physics-question_paper-A4-collegedekho.pdf p.10 | 1 | Key cell A4 re-read as 1 (option A, total energy) and transcription is exact; but P = (2/3)(N/V)<KE> so average kinetic energy (B) is the direct answer (for an ideal gas total energy = KE too, so A is also arguable); third-party solution on the paper page also says B. |
| tp-ncert-chem-11-ch03-012a | flagged | several sub-questions share one printed number; key mapping ambiguous | sources/third-party/chemistry/ncert-exemplar-11/keep503.pdf p.3 | (a) (iii), (b) (iii), (c) (iii), (d) (i), (e) (ii) |  |
| tp-ncert-chem-11-ch03-012b | flagged | several sub-questions share one printed number; key mapping ambiguous | sources/third-party/chemistry/ncert-exemplar-11/keep503.pdf p.3 | (a) (iii), (b) (iii), (c) (iii), (d) (i), (e) (ii) |  |
| tp-ncert-chem-11-ch03-012c | flagged | several sub-questions share one printed number; key mapping ambiguous | sources/third-party/chemistry/ncert-exemplar-11/keep503.pdf p.3 | (a) (iii), (b) (iii), (c) (iii), (d) (i), (e) (ii) |  |
| tp-ncert-chem-11-ch03-012d | flagged | several sub-questions share one printed number; key mapping ambiguous | sources/third-party/chemistry/ncert-exemplar-11/keep503.pdf p.4 | (a) (iii), (b) (iii), (c) (iii), (d) (i), (e) (ii) |  |
| tp-ncert-chem-11-ch03-012e | flagged | several sub-questions share one printed number; key mapping ambiguous | sources/third-party/chemistry/ncert-exemplar-11/keep503.pdf p.4 | (a) (iii), (b) (iii), (c) (iii), (d) (i), (e) (ii) |  |
| tp-ncert-chem-11-ch06-011 | flagged | blind solver and key disagree | sources/third-party/chemistry/ncert-exemplar-11/keep506.pdf p.3 | C | Key (iii) x>y read correctly from image; but (a) is reverse atomisation of CH4 (about -1665 kJ/mol) vs formation y (about -75), so x<y; printed key justification only holds for magnitudes. |
| tp-ncert-chem-11-ch07-008 | flagged | blind solver and key disagree | sources/third-party/chemistry/ncert-exemplar-11/keep507.pdf p.2 | iv | Key (iv) read correctly from answers text layer, but higher Ka means lower pH; Ka formic > acetic > HOCl so pH order is HOCl > acetic > formic = option (ii); key (iv) lists the Ka order, not pH. |
| tp-ncert-chem-11-ch12-001 | flagged | blind solver and key disagree | sources/third-party/chemistry/ncert-exemplar-11/keep512.pdf p.1 | B | Key (ii) read correctly from NCERT answer page, but IUPAC requires alphabetical order (ethyl before dimethyl) so 3-Ethyl-4,4-dimethylheptane (i) is the correct name; (ii) lists substituents non-alphabetically. Official key appears wrong. |
| tp-ncert-chem-12-ch02-020 | flagged | blind solver and key disagree | sources/third-party/chemistry/ncert-exemplar-12/leep502.pdf p.4 | (iii) | Key (iii) i_A=i_B=i_C is wrong: NaCl dissociation increases on dilution so i rises, iA<iB<iC (option i). Transcription and key reading verified. |
| tp-ncert-chem-12-ch02-023 | flagged | blind solver and key disagree | sources/third-party/chemistry/ncert-exemplar-12/leep502.pdf p.5 | (i) | Key (i) A-B stronger is wrong: minimum boiling azeotrope arises from positive deviation, i.e. weaker A-B interactions (option iv). Transcription and key reading verified. |
| tp-ncert-chem-12-ch02-025 | flagged | blind solver and key disagree | sources/third-party/chemistry/ncert-exemplar-12/leep502.pdf p.6 | (ii) | Key (ii) maximum boiling with positive deviation is self-contradictory; positive deviation gives minimum boiling azeotrope (option i). Transcription and key reading verified. |
| tp-ncert-chem-12-ch03-015 | flagged | blind solver and key disagree | sources/third-party/chemistry/ncert-exemplar-12/leep503.pdf p.3 | (i) | Key reads (i) correctly, but on charging (electrolytic mode) the Pb plate is the cathode where PbSO4 is reduced to Pb; (i) calls it anode, which is wrong in electrolytic convention (known NCERT key issue). |
| tp-ncert-chem-12-ch03-017 | flagged | blind solver and key disagree | sources/third-party/chemistry/ncert-exemplar-12/leep503.pdf p.4 | (ii) | Key reads (ii) correctly, but Cl- oxidation (iv) is the actual anode reaction in brine electrolysis; the book's own answer to Q34 says Cl- is oxidised instead of water due to O2 overpotential. |
| tp-ncert-chem-12-ch04-014 | flagged | blind solver and key disagree | sources/third-party/chemistry/ncert-exemplar-12/leep504.pdf p.5 | ii | Key page k0-14 reads 14.(ii) doubled (read correctly), but rate constant depends only on temperature, so it stays the same (option i). Transcription verified against p-05. |
| tp-ncert-chem-12-ch13-027 | flagged | blind solver and key disagree | sources/third-party/chemistry/ncert-exemplar-12/leep513.pdf p.6 | (iii) | Key (iii) read correctly and transcription matches p.6, but amide+LiAlH4 (and nitrile+LiAlH4, printed 'nitrite') also keeps carbon count, so the question is ambiguous; NCERT key says Gabriel (iii). |
| tp-ncert-math-11-ch01-037 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-11/keep201.pdf p.16 | C | Key reading confirmed (C). X={0,49,490,...} is a proper subset of Y (98 in Y, not in X), so X subset Y (A); X=Y is false. |
| tp-ncert-math-11-ch01-042 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-11/keep201.pdf p.17 | B | Key reading confirmed (B=31). Transcription exact; n(S)=33, n(P)=8 gives 41, which is not among options, so no option is correct; key 31 does not match either. |
| tp-ncert-math-11-ch02-026 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-11/keep202.pdf p.12 | B | Key image reads B, but 1-2cosx in [-1,3]\{0} so range of reciprocal is (-inf,-1] U [1/3,inf) = C; printed key is an NCERT error (B cannot be the range since f(0)=-1 is attained but f can be 1/3<... values >1 too). |
| tp-ncert-math-11-ch05-037 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-11/keep205.pdf p.23 | B | Printed key says B (x<y<0), but zbar/z=(x^2-y^2-2ixy)//z/^2 needs x^2<y^2 and xy>0 with x,y<0, i.e. y<x<0 (C); B gives /x/>/y/ so real part positive (4th quadrant). NCERT key erratum; transcription and key reading both verified. |
| tp-ncert-math-11-ch06-026 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-11/keep206.pdf p.13 | A | Key (read correctly from k0-06: 26. A) says /x/<5, but Fig 6.7 shows a shaded band with solid, undashed edges at -5 and 5, which conventionally means /x/<=5 (B). Transcription verified exact. Printed NCERT key is A, likely treating the graph loosely; flag for human decision. |
| tp-ncert-math-11-ch10-041 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-11/keep210.pdf p.19 | B | Key B (2,2) read correctly, but side x+y=2 is at distance sqrt2 (inradius) from centroid so opposite vertex is (-2,-2); (2,2) would have opposite side x+y=-2, not x+y=2. |
| tp-ncert-math-11-ch12-027 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-11/keep212.pdf p.15 | B | Printed key says B (y=0,z=0 = x-axis), but y-axis is x=0,z=0 = option C; transcription verified against p-15 image, key read correctly. |
| tp-ncert-math-11-ch15-026 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-11/keep215.pdf p.12 | B | Key image prints 26. B (179), read correctly; but mean=1446, abs deviations 89+356+220+48+177=890, 890/5=178 exactly, so (A) is correct and the printed key looks wrong. |
| tp-ncert-math-11-ch16-018 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-11/keep216.pdf p.16 | A | Key image prints A (1/7), read correctly; but non-leap year has 52 weeks + 1 extra day, 53 Tue or Wed iff extra day is Tue or Wed = 2/7 (B); printed key is wrong. |
| tp-ncert-math-12-ch02-037 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-12/leep202.pdf p.22 | A | Key image clearly prints 37. A, but cos^-1 x > sin^-1 x <=> sin^-1 x < pi/4 <=> -1 <= x < 1/sqrt2 which is (C); (A) gives the reverse inequality. Transcription verified against page image; printed key appears to be an NCERT error. |
| tp-ncert-math-12-ch04-025 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-12/leep204.pdf p.16 | C | Key (read as C, confirmed on image) gives a^3+b^3+c^3-3abc, but the determinant as printed is 0 (e.g. a=1,b=c=0: rows 2 and 3 equal, det 0, while C=1; a=0,b=c=1: det 0, B=3); so none of these (D). |
| tp-ncert-math-12-ch06-056 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-12/leep206.pdf p.25 | A | Transcription and key reading both confirmed (key says A). But f'(5pi/6)=6cos(5pi/2)-9sin(5pi/2)=-9 != 0, so not a stationary point: neither max nor min (D); the printed key (maximum) is wrong for the question as printed. |
| tp-ncert-math-12-ch07-051 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-12/leep207.pdf p.25 | C | Key image prints C (read correctly), but (1-x)^2/(1+x^2)^2 = 1/(1+x^2) - 2x/(1+x^2)^2 = f+f1 with f=1/(1+x^2), so integral = e^x/(1+x^2)+C = option A; differentiating C gives a different result; printed key looks erroneous. |
| tp-ncert-math-12-ch09-035 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-12/leep209.pdf p.17 | C | Squaring gives (1+p^2)^3=(y'')^2, polynomial in derivatives, degree 2; 'not defined' is wrong (NCERT key erratum). |
| tp-ncert-math-12-ch09-042 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-12/leep209.pdf p.18 | A | y=Ax+A^3 with A=y' gives y=xy'+y'^3, degree 3; key A (1) is wrong. |
| tp-ncert-math-12-ch09-045 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-12/leep209.pdf p.19 | B | General solution y+1=C(x-1) gives y(1)=-1, never 2, so no solution; key B (one) is wrong. |
| tp-ncert-math-12-ch13-058 | flagged | blind solver and key disagree | sources/third-party/mathematics/ncert-exemplar-12/leep213.pdf p.22 | D | Transcription matches page; P(AnB)=0.1 so P(B/A)+P(A/B)=1/3+1/4=7/12, not among options; key D (7/2) is wrong (printed-key error), 5/12 is nearest but also not correct |
| tp-ncert-phys-11-ch02-002 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-11/keep302.pdf p.1 | (b) | Transcription and key reading both verified (key says 2.2 (b) 664). Sum 663.821 must be rounded to least decimal places (227.2 has one) giving 663.8 (option c); printed key appears wrong. |
| tp-ncert-phys-11-ch03-002 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-11/keep303.pdf p.2 | A | Key (a) x<0 is impossible: lift is at 4th-8th floor above origin so x>0; moving down v<0; about to stop so a>0 => option (c). Transcription and key reading (3.2 (a)) both confirmed; printed key appears to be an NCERT erratum. |
| tp-ncert-phys-11-ch04-009 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-11/keep304.pdf p.3 | C | Key (c) read correctly from printed key, but (c) is true ((AxB)xC is perpendicular to plane normal so lies in plane); (b) is false since A+B+C=0 makes (AxB).C=0 always. NCERT key error. |
| tp-ncert-phys-11-ch04-010 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-11/keep304.pdf p.3 | B | Key (b) read correctly, but /A+B/=/A/ gives A.B=-B^2/2<=0, so only (d) necessarily follows; antiparallel is just a special case (B=-2A) not necessary. |
| tp-ncert-phys-11-ch06-013 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-11/keep306.pdf p.5 | D | Transcription matches page; key (d) read correctly from text layer, but (d) is an undamped oscillating curve going negative. Total mechanical energy of a damped pendulum decreases monotonically to zero and is never negative, so (c) is correct; key looks wrong. |
| tp-ncert-phys-12-ch01-007 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-12/leep101.pdf p.3 | A | Key image reads 1.7 (a) (official NCERT answer), transcription correct. But all charge lies on one side of the flat-face plane, so at an outside point on a diameter the field has radial and out-of-plane components; not perpendicular, tilted away from the diameter (d). Official key is likely idealised/wrong. |
| tp-ncert-phys-12-ch05-002 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-12/leep105.pdf p.1 | A | Transcription matches page 1-2; key page reads 5.2 (a). My pick (b) is also physically true, but the question is single-answer and the NCERT key says (a); not clearly wrong, keep key. |
| tp-ncert-phys-12-ch08-002 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-12/leep108.pdf p.1 | (b) | Key image reads 8.2 (b) (confirmed). Transcription matches page. Perfect reflector needs E=0 at wall, so reflected wave is -E0 i cos(kz+wt), option (c); (b) has no phase flip. |
| tp-ncert-phys-12-ch08-004 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-12/leep108.pdf p.2 | (d) | Key image reads 8.4 (d) (confirmed). Transcription matches page. I proportional to P and E^2, so E scales as sqrt(P): 50 W gives E/sqrt2, option (c); key's sqrt2 E is wrong. |
| tp-ncert-phys-12-ch09-010 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-12/leep109.pdf p.3 | D | Key (d) is printed in the answer file, but (a) is also true (60+5=65 km/h) and the question says 'statement(s) is/are correct', so it has more than one correct option; single-answer use is unsafe. |
| tp-ncert-phys-12-ch10-002 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-12/leep110.pdf p.1 | A | Transcription and key reading (a) verified. 1e4 A = 1 micron is comparable to visible wavelengths so diffraction gives coloured fringes (c); NCERT key (a) looks wrong. |
| tp-ncert-phys-12-ch10-005 | flagged | blind solver and key disagree | sources/third-party/physics/ncert-exemplar-12/leep110.pdf p.2 | D | Transcription and key reading (d) verified. P2 is a minimum so no light reaches the hole and the second screen is dark (b); NCERT key (d) looks wrong. |

## Transcriber notes (informational)

- **pyq-2008-chemistry**: Q85 option 4: printed as Pl(NH3)4 Cl2 (probably a typo for Pt); kept as printed.
- **pyq-2008-chemistry**: Q111: key is G (grace mark), so no correct option is recorded (options: []).
- **pyq-2008-chemistry**: Q93: key is 23, meaning options 2 and 3 are both correct (stored as 0-indexed [1,2]).
- **pyq-2008-mathematics**: Q50 option 2 is printed truncated as 'is not differentiable at x' (cut off at the page edge); transcribed as printed.
- **pyq-2008-mathematics**: Q11 option 2 prints 'w' for the cube root of unity; transcribed as \omega.
- **pyq-2008-mathematics**: job.json key_pdfs points to the physics key PDF, but that PDF holds all four subjects. The mathematics page (k0-3) was used and matches key_a/key_b for all 60 answers.
- **pyq-2009-chemistry**: Q29 key lists two accepted options (A and B) per the official key; kept as is
- **pyq-2009-chemistry**: Q44 key is grace (G, no option); kept as grace with empty options
- **pyq-2009-mathematics**: Q13: paper prints digit 1 where q is evidently intended; transcribed as printed (1), flagged in notes
- **pyq-2009-mathematics**: Q57: printed typo 'orign' kept as printed
- **pyq-2009-mathematics**: Q8 (13), Q53 (24) multiple-answer keys; Q13, Q45, Q60 grace-mark keys (no single answer), recorded as in official key
- **pyq-2009-physics**: Q60: official key is G (grace mark), no option key; recorded as empty options with grace=true
- **pyq-2010-mathematics**: Q22: key is G (grace mark), no option recorded
- **pyq-2010-mathematics**: Q27: key is 123 (multiple options 1, 2, 3 correct)
- **pyq-2010-mathematics**: Job.json key_pdfs points at the physics key file, but the same PDF contains the maths key (k0-3.png); the maths page was used and agrees with key_a/key_b
- **pyq-2010-physics**: Q30: option 4 is clipped at the right margin of the scan (prints 'phase difference of pi/' plus a cut-off character). Transcribed as pi/2 and noted in the notes field.
- **pyq-2010-physics**: Q60: stem prints 'radius ... = 0.53 A' with no visible ring over the A. Transcribed as angstrom to match the options, and noted in the notes field.
- **pyq-2010-physics**: Q36 and Q58: key is 'G' (grace mark) with no option. Stored as options [] and grace true, same as key_a.json.
- **pyq-2010-physics**: Q59: the gate shapes in the figure look like NOR gates (curved OR shape with an output bubble). The question and options are transcribed as printed, and the figure is cropped.
- **pyq-2011-mathematics**: Key: Q14, Q33, Q53, Q55 are 'G' (grace mark) for version A1; key.json has empty options and grace=true for them.
- **pyq-2011-mathematics**: Q3 prints 'In n is an odd...' (likely a misprint of 'If'); transcribed as printed.
- **pyq-2011-mathematics**: Q23 option 1 and Q59 options 1 and 3 print oddly (no fraction bar, no y factor, 'k tan kn'); transcribed as printed.
- **pyq-2011-mathematics**: No diagrams are needed in this paper; no crops were made.
- **pyq-2011-physics**: Q36: image shows a comma-like mark or speck after 'blue' (OCR read ';'); transcribed as a comma and noted in the question's notes field.
- **pyq-2011-physics**: Q13 and similar stems: trailing blank dotted lines ('.......') are omitted, matching the other questions in the extract.
- **pyq-2012-physics**: Q39: key shows G (grace mark), so no single correct option is recorded.
- **pyq-2012-physics**: Q25: provisional key says 2, the final A1 key says 1. I used the final key, option 1.
- **pyq-2012-physics**: Q15, Q4, Q17, Q39, Q48 and Q51: diagram crops are complete but include a sliver of neighbouring text at the edge.
- **pyq-2012-physics**: Q23 and Q28: I did not view the page image for these. Blank dots are copied from extract B and may differ in dot count.
- **pyq-2013-physics**: Q21: options 2-4 are printed as mixed-number style (coefficient beside stacked theta/denominator) and are transcribed as 2\frac{\theta}{3} etc.; the layout is ambiguous, but the official key says option 1 is correct, so it does not affect grading.
- **pyq-2013-physics**: Key: Q6, Q24, Q30, Q31, Q37 and Q40 are grace-mark (G) entries with no option in the official A1 key. Q1, Q4, Q16 and Q43 have multiple correct options (24, 23, 34, 134).
- **pyq-2014-chemistry**: Q7 and Q43: the official key gives two correct options (7: options 1 and 2; 43: options 1 and 3), copied as printed.
- **pyq-2014-chemistry**: Q10, 16, 20, 27, 31, 54, 57, 59 and 60: the official key shows G (grace mark), so key.json has no option for them (options [], grace true).
- **pyq-2014-chemistry**: Q31 (BCl2), Q27 (Kb = 4.74), Q59 (missing mass of coke) and Q20 (1/T vs k) look like printing errors in the paper. They are transcribed as printed.
- **pyq-2014-mathematics**: Q38: printed text has typo 'comlex' for 'complex'; kept as printed (noted in notes)
- **pyq-2014-mathematics**: Key: Q5, Q15, Q35 are 'G' (grace, all options accepted) and multi-answer entries (Q12, Q21, Q41, Q53) kept as in the official key; no key discrepancies between extractors
- **pyq-2015-mathematics**: Q15: printed second direction cosine is -9/3 (digit 9 clearly legible, transcribed as printed); no option fits it, so it looks like a paper error. The key gives a grace mark (G).
- **pyq-2015-mathematics**: Q10: key gives a grace mark (G). Stem prints (-p) with a short dash, transcribed as (-p).
- **pyq-2015-mathematics**: Q29: key value '14' means options 1 and 4 are both correct (multiple answers). Stored as options [0,3].
- **pyq-2015-mathematics**: Q9: the options print the inequations separated only by spacing, no commas. Transcribed with \quad.
- **pyq-2015-mathematics**: key_pdfs in job.json points to the physics key file. The maths key is page k0-3 (ANSWER KEYS - MATHS). key.json matches that page, and compare_keys.py reported 0 issues.
- **pyq-2015-physics**: Q19 and Q44: the key marks both as grace (G, no option). Both extracts agree and compare_keys found no issues, so I kept them. I did not re-check the key images.
- **pyq-2015-physics**: Q2: the graph shows 40 degrees from the velocity axis, and option 2 prints tan 50 degrees. I transcribed both as printed.
- **pyq-2015-physics**: Q50: the stem has a punctuation difference between extracts (comma vs period after n = 2). The image shows a comma, so I used that.
- **pyq-2016-mathematics**: Q46: official key A1 lists 134 (multiple correct answers: options 1, 3, 4); stored as options [0,2,3]
- **pyq-2016-physics**: Q16: official key is G (grace mark awarded, no single correct option); key.json has options [] and grace true
- **pyq-2016-physics**: Q50: official key is 1234 (all four options accepted); key.json has options A-D
- **pyq-2016-physics**: Q49/Q50: wavelength unit printed as 'ηm' (typo for nm); transcribed as nm, noted in notes
- **pyq-2016-physics**: Q42: printed 'discipated' kept as printed
- **pyq-2016-physics**: Q8: options are graph images; option strings are (A)-(D) in printed (1)-(4) order
- **pyq-2017-chemistry**: Q5: key is 'BC' (two options accepted) per official key
- **pyq-2017-chemistry**: Q27: key is 'AB' (two options accepted) per official key
- **pyq-2017-chemistry**: Q48 and Q60: key is GRACE (no single answer)
- **pyq-2017-chemistry**: Q37, Q56 and Q58: printed oddities kept as printed (superscript + in Q37 A and D, 'pyridoxime' in Q56 B, '-CO-' in Q58 A)
- **pyq-2017-mathematics**: Q19: official key is GRACE (no single answer; options left empty in key.json)
- **pyq-2017-mathematics**: Q33: official key lists multiple answers ACD (options [0,2,3])
- **pyq-2017-physics**: Q1: official key is GRACE (no single correct option), so key.json has an empty options list with grace=true
- **pyq-2019-chemistry**: Q50: official key for A1 is '34' (multiple correct answers, options C and D), encoded as options [2,3]
- **pyq-2019-chemistry**: Q59: printed symbol after 'molar mass of' looks like A with a ring; kept as 'Å'
- **pyq-2019-chemistry**: Q34: stem has no trailing 'is' or period in print; transcribed without either
- **pyq-2019-mathematics**: Official A1 key marks Q4, Q9 and Q48 as G (grace). The printed questions look flawed for all three, so no answer option is recorded for them.
- **pyq-2019-mathematics**: Several printed questions have an answer that is not among the options as I computed it. These are Q4, Q28, Q48 and Q49. I transcribed all of them as printed and did not correct them.
- **pyq-2019-physics**: Q26: official key gives grace mark (G) for A1, so no correct option recorded (options: [], grace: true)
- **pyq-2019-physics**: Q36: printed stem does not define source voltage V used in the options (transcribed as printed)
- **pyq-2019-physics**: Q12: figure crop includes the printed line 'Which of the following graph shows...' between the v-x graph and the option graphs
- **pyq-2019-physics**: Q50 and Q56: options/blank transcribed to match the printed layout, flagged in notes
- **pyq-2020-physics**: Q10 option B: a stray dot sits left of and above 'q' in '- q/24 eps0' on the scan. Transcribed as q/(24 eps0). It could be a minus sign.
- **pyq-2020-physics**: Q11: all four options print the unit V m^-1 although the question asks for a force. Transcribed as printed.
- **pyq-2020-physics**: Q6, Q37, Q47, Q56: the printed wording is grammatically incomplete or odd. Kept as printed.
- **pyq-2020-physics**: Q12, Q47: key shows G (grace mark) only in column A1. key.json stores options [] with grace=true for these.
- **pyq-2020-physics**: Q57: kept the printed typo 'bicycles'.
- **pyq-2021-chemistry**: Q20, Q28, Q33, Q36, Q53: printed typos or garbled wording kept verbatim (see notes in questions.json)
- **pyq-2021-chemistry**: Q47: printed H_gSO_4 in the figure, kept as printed; the figure is cropped as an image
- **pyq-2021-chemistry**: Q17 crop: the figure is slightly tight, with a few stray letters of neighbouring text at the edges
- **pyq-2022-mathematics**: Q4, Q40, Q48: paper prints 'NO OPTION' as the answer; the official key gives grace (G) for Q4 (D3), so key.json has no option for it. Q40 and Q48 key entries were not re-checked beyond the compare (only Q11 differed).
- **pyq-2022-mathematics**: Q38: official key is 1234 (all options correct)
- **pyq-2022-mathematics**: Q59: options 2 and 3 are identical as printed
- **pyq-2022-mathematics**: Q11 key: A read 4 and B read 3. The key image shows D3=3 (option 3), so key.json uses 3.
- **pyq-2022-mathematics**: No diagrams are needed, so img/ is empty.
- **pyq-2022-physics**: Q15: official key B3 is G (grace mark), so key.json has an empty option list with grace=true and no answer option.
- **pyq-2022-physics**: Q13 and Q20: the printed values do not match any option exactly. Both are transcribed as printed and flagged in notes. Q20's key answer is option 2, and the paper's own solution (14.4e-13 N) disagrees with every option.
- **pyq-2022-physics**: Q41: the ray diagram is in the answer-solution column, not with the question, so no crop was made.
- **pyq-2022-physics**: Q7: no figure is printed with the question.
- **pyq-2023-physics**: Q12: printed solution m^2E^2/(qB^3) matches no option and the paper says 'No answer'; the official key gives grace marks (G), so key.json has no option for it.
- **pyq-2023-physics**: Q41: official key lists two correct options (A and C); recorded as [0, 2].
- **pyq-2023-physics**: Q22: the paper's own printed answer is C (0.4), but the official KEA key says 4 (option D, 2.5). I used the official key.
- **pyq-2023-physics**: Q3, Q7, Q21 and Q50: printed stems end without a question phrase. Transcribed as printed.
- **pyq-2024-chemistry**: Q55: key value is 204 (multiple answers correct) and the key does not name the options. key.json stores B (Sb) and D (Se) by inference, matching both extracts. This is unverified.
- **pyq-2024-chemistry**: Q9: options are images (img/pyq-2024-chemistry-009.png). A handwritten circle and tick on option (A) overlaps the label and could not be cropped out.
- **pyq-2024-chemistry**: Q1-4, Q31-33, Q43-48 and Q50-51 are '7' (excluded) in the A2 key column. They are stored as grace with empty options.
- **pyq-2024-chemistry**: Q53: the printed codes table has only i/ii/iii per column. The options are written as 'I – i, II – ii, III – iii' to be self-contained, which is not word-for-word as printed.
- **pyq-2024-chemistry**: Q24: each option is printed on two lines. Both lines are joined with '; ' in one option string.
- **pyq-2024-mathematics**: Q11: end of f(x) is hidden by a QR code on the scan. Visible text is 'x (x -' and the text layer gives 'x (x-1'. I wrote x(x-1)^2, with the exponent inferred because it makes option B (4/3) correct. The official key marks Q11 as excluded (7).
- **pyq-2024-mathematics**: Key: 22 questions have an empty options list in key.json (1, 4, 11, 22, 23, 24, 28, 30, 32, 33, 34, 35, 37, 38, 39, 55 and others). The A2 column prints 7 (excluded) for most of them and 0 for Q4, which key.json stores as grace=true. I compared key.json to the key image and all 60 A2 values match.
- **pyq-2024-mathematics**: Q24: decimals are printed as middle dots (0·2) and were kept as printed.
- **pyq-2024-mathematics**: Q29: the modulus bars around a+b are not printed, so the stem was left as printed.
- **pyq-2024-physics**: Q32: word 'A' after 'due to' is hidden by a QR code in the print; restored as 'due to A'
- **pyq-2024-physics**: Q48: printed spelling 'hysterisis' kept as printed
- **pyq-2024-physics**: Key: Q2,4,11,14,43,48,49,54,57 are excluded (code 7, grace true, no options); Q50 grace mark (code 0); Q22 has two correct options (3 and 4)
- **pyq-2025-physics**: Q1: final KEA key marks GRACE (provisional key said option D); key.json has empty options with grace=true
- **pyq-2025-physics**: Q16: the paper prints no figure for the two paths A to B, so none was cropped
- **pyq-2025-physics**: Q55: each option prints rho and sigma on two lines with no separator; transcribed with a comma between them
- **pyq-2025-physics**: Several diagram crops include a thin sliver of neighbouring text at the edge; every figure is complete
- **pyq-2026-chemistry**: Q48: the final KEA key marks Q48 (chemistry A1) as GRACE. The provisional key said option 1. I recorded it as grace with no option (options: [], grace: true), as key_a did. The pipeline needs to decide how to score grace.
- **pyq-2026-chemistry**: Q11 and Q12: the printed structures are written as linear chain formulas in LaTeX. Q11 also has a crop of the drawn structure. Q12 has no crop.
- **pyq-2026-chemistry**: Q39 and Q19: the drawn structures are in the crop images. The Q39 stem marks them '(see diagram)'. Q19 uses options_are_images with the labels (A) to (D).
- **pyq-2026-physics**: Q13: official key gives GRACE (all candidates get the marks), so key.json has empty options with grace=true.
- **pyq-2026-physics**: Q42 option A is printed as 'B l x' (x, not v). I kept it as printed.
- **pyq-2026-physics**: Q1, Q23, Q46 and Q47 stems keep the printed 'Codes:' line (extract A's version).
- **pyq-2026-physics**: Q36 options are typeset formulas. I transcribed them as text (extract B's version) and set options_are_images=false. The crop covers the figure only.
- **pyq-2026-physics**: Kannada parallel text was not transcribed. English pages only.
- **pyq-2026-physics**: Q36, Q59 and a few other crops have thin slivers of neighbouring text at an edge. I judged these harmless.
- **tp-ncert-chem-11-ch03**: Q12 is a comprehension with five sub-parts (a)-(e), transcribed as five entries all numbered 12 (page 3/4), so numbers are not unique. Key entry '12' has options [] and an extra 'parts' field: a=iii(2), b=iii(2), c=iii(2), d=i(0), e=ii(1). The downstream importer needs to handle this.
- **tp-ncert-chem-11-ch03**: Q7: options (ii) and (iv) are identical as printed (F < Cl < Br < I); kept as printed. Key says (iii).
- **tp-ncert-chem-11-ch07**: Q11 option D is printed as CH4COONa (typo in source for CH3COONa); transcribed as printed
- **tp-ncert-chem-12-ch09**: Q2: options (i) and (iv) are identical as printed in the source; key says (iii). Transcribed as printed.
- **tp-ncert-math-11-ch01**: Q33 stem refers to a square/triangle/circle but the page prints no figure; none cropped
- **tp-ncert-math-11-ch01**: Q39: sets A and B are printed on one line with no connecting word; kept as printed
- **tp-ncert-math-11-ch01**: Q41: expression has unbalanced parentheses as printed; kept as printed
- **tp-ncert-math-11-ch02**: Q32: options C and D are identical in the printed source (both Domain = [1, inf), Range = [0, inf)); key says C.
- **tp-ncert-math-11-ch02**: Q35: options A and B are identical in the printed source; key says A.
- **tp-ncert-math-11-ch13**: Q59: options B and D both printed as 1 (kept as printed; key says C)
- **tp-ncert-math-11-ch13**: Q58: printed limit is x->0 but expression in theta (kept as printed)
- **tp-ncert-math-11-ch16**: Q27: option B printed with a blank gap before '.5' (symbol, probably '=', missing in the scan); transcribed as '.5'. Key answer is C so no impact on the key.
- **tp-ncert-math-12-ch01**: Q45: option B printed as '1' (identical to A; likely a lost minus sign in source) - transcribed as printed
- **tp-ncert-math-12-ch01**: Q44/Q45: fourth option labelled (B) in print - transcribed in printed order
- **tp-ncert-math-12-ch02**: Q31: printed text reads 'x in ]0, 1, then' (closing bracket missing, likely a misprint of ]0,1[); transcribed as printed.
- **tp-ncert-phys-11-ch12**: Q1, Q3, Q4 diagram crops: edge fragments of neighbouring text still show (Q1 has 'he/ic/ch' at left and 'This is' at the bottom). The figures are complete.
- **tp-ncert-phys-11-ch12**: Q2 key is (a) 0.25 kg, but 14.5/580 = 0.025. The printed option and the key both say 0.25, so I kept them as printed.
- **tp-ncert-phys-11-ch14**: Q1 option A printed as '2p/w' (typo for 2pi/omega in the source); transcribed as printed
- **tp-ncert-phys-11-ch14**: Q9 stem printed as cos(alpha t)^2; transcribed as printed
- **tp-ncert-phys-12-ch11**: Q4 refers to Fig. 11.7 of the NCERT textbook, which is not printed on these pages, so it has no diagram crop.
- **tp-neet-2019-chemistry**: Q51: the official NTA key gives option 4 (30 J), but the Aakash solution in the paper says answer (1) (-30 J). I used the official key (key.json). The printed answer looks like a key error, so check this.
- **tp-neet-2019-chemistry**: Q72: the official key is 'A', which means options 1 and 2 are both accepted. key.json has options [0, 1].
- **tp-neet-2022-chemistry**: Q93: NTA key lists option id 5 (dropped/no valid answer; printed E°cell = 10.5 V). key.json has options [] with grace true, raw '5'.
- **tp-neet-2022-chemistry**: Q67: options 3 and 4 are structure images; set options_are_images true with option strings (A)-(D), and the crop includes all four options.
- **tp-neet-2022-chemistry**: Q72: options 3 and 4 explanatory text is printed on separate lines to the right of the equation; joined with commas.
- **tp-neet-2025-chemistry**: Q63: official key accepts options 1 and 2 (raw '1,2'); kept both as printed in key
