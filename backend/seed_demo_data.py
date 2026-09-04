import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from database import SessionLocal
from core.security import hash_password
from models.user import User
from models.case import Case
from models.hearing import Hearing
from models.document import Document
from models.task import Task
from models.notification import Notification
from rag.engine import index_all_documents

UPLOADS_DIR = backend_dir / "uploads" / "documents"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def seed_demo_data():
    print("================================================================================")
    print("        JUDICIAL FLOW PRO — SEEDING REALISTIC DEMO DATASET                     ")
    print("================================================================================")
    db = SessionLocal()

    now = datetime.now(timezone.utc)

    # 1. Verify / Ensure Core Demo Users
    print("\n--- [1/6] Seeding Judicial Staff & Judges ---")
    admin = db.query(User).filter(User.email == "admin@judicialflow.gov").first()
    if not admin:
        admin = User(
            email="admin@judicialflow.gov",
            hashed_password=hash_password("AdminPass123!"),
            full_name="System Administrator",
            role="ADMIN",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    judge_sarah = db.query(User).filter(User.email == "judge.sarah@court.gov").first()
    if not judge_sarah:
        judge_sarah = User(
            email="judge.sarah@court.gov",
            hashed_password=hash_password("JudgePass123!"),
            full_name="Hon. Sarah Jenkins",
            role="JUDGE",
            is_active=True,
        )
        db.add(judge_sarah)
        db.commit()
        db.refresh(judge_sarah)

    judge_marcus = db.query(User).filter(User.email == "judge.marcus@court.gov").first()
    if not judge_marcus:
        judge_marcus = User(
            email="judge.marcus@court.gov",
            hashed_password=hash_password("JudgePass123!"),
            full_name="Hon. Marcus Reynolds",
            role="JUDGE",
            is_active=True,
        )
        db.add(judge_marcus)
        db.commit()
        db.refresh(judge_marcus)

    demo_judge = db.query(User).filter(User.email == "demo@judicialflow.gov").first()
    if not demo_judge:
        demo_judge = User(
            email="demo@judicialflow.gov",
            hashed_password=hash_password("JudicialDemo123!"),
            full_name="Hon. Demo Judge",
            role="JUDGE",
            is_active=True,
        )
        db.add(demo_judge)
        db.commit()
        db.refresh(demo_judge)

    print(f"[OK] Users ready: Admin ({admin.email}), Judge Sarah ({judge_sarah.email}), Judge Marcus ({judge_marcus.email}), Demo Judge ({demo_judge.email})")

    # 2. Reset existing demo records safely (idempotent reseed)
    print("\n--- [2/6] Cleaning Previous Demo Data ---")
    # Clean notifications, tasks, hearings, documents, cases
    db.query(Notification).delete()
    db.query(Task).delete()
    db.query(Hearing).delete()
    db.query(Document).delete()
    db.query(Case).delete()
    db.commit()
    print("[OK] Previous dataset cleaned.")

    # 3. Seed 11 Realistic Cases
    print("\n--- [3/6] Seeding 11 Interconnected Judicial Cases ---")
    demo_cases_data = [
        {
            "case_number": "JFP-2026-0101",
            "title": "Vanguard Renewable Energy LLC v. Pacific Grid Corp",
            "description": "Breach of 500MW grid interconnection agreement, alleged tariff manipulation, and misappropriation of proprietary battery management firmware.",
            "case_type": "Commercial",
            "status": "HEARING",
            "priority": "URGENT",
            "filing_date": (now - timedelta(days=15)).date(),
            "courtroom": "Courtroom 3A",
            "assigned_judge": "Hon. Sarah Jenkins",
        },
        {
            "case_number": "JFP-2026-0102",
            "title": "State Coastal Commission v. Apex Maritime Logistics Ltd",
            "description": "Admiralty enforcement action regarding oil discharge in coastal shipping lane and deliberate violation of harbor radar navigation rules.",
            "case_type": "Civil",
            "status": "UNDER_REVIEW",
            "priority": "HIGH",
            "filing_date": (now - timedelta(days=28)).date(),
            "courtroom": "Courtroom 2B",
            "assigned_judge": "Hon. Marcus Reynolds",
        },
        {
            "case_number": "JFP-2026-0103",
            "title": "Quantum BioPharma Shareholders v. Sterling Ventures Corp",
            "description": "Derivative shareholder suit alleging breach of fiduciary duty during $1.2B merger buyout and non-disclosure of FDA clinical trial hold.",
            "case_type": "Commercial",
            "status": "ASSIGNED",
            "priority": "HIGH",
            "filing_date": (now - timedelta(days=40)).date(),
            "courtroom": "Courtroom 4A",
            "assigned_judge": "Hon. Sarah Jenkins",
        },
        {
            "case_number": "JFP-2026-0104",
            "title": "CloudStack Technologies Inc v. HyperScale Data Systems",
            "description": "Allegations of monopolistic tying in enterprise cloud storage APIs and exclusionary developer lock-in agreements.",
            "case_type": "Civil",
            "status": "FILED",
            "priority": "MEDIUM",
            "filing_date": (now - timedelta(days=5)).date(),
            "courtroom": "Courtroom 1C",
            "assigned_judge": "Hon. Marcus Reynolds",
        },
        {
            "case_number": "JFP-2026-0105",
            "title": "Metro Transit Alliance v. Department of Environmental Protection",
            "description": "Petition for judicial review of environmental impact report for proposed Light Rail Expansion Phase II.",
            "case_type": "Administrative",
            "status": "DECISION",
            "priority": "MEDIUM",
            "filing_date": (now - timedelta(days=60)).date(),
            "courtroom": "Courtroom 2A",
            "assigned_judge": "Hon. Sarah Jenkins",
        },
        {
            "case_number": "JFP-2026-0106",
            "title": "People of the State v. Marcus Vance",
            "description": "Felony indictment charging wire fraud, conspiracy to embezzle municipal pension assets, and money laundering.",
            "case_type": "Criminal",
            "status": "HEARING",
            "priority": "URGENT",
            "filing_date": (now - timedelta(days=12)).date(),
            "courtroom": "Courtroom 5B",
            "assigned_judge": "Hon. Marcus Reynolds",
        },
        {
            "case_number": "JFP-2026-0107",
            "title": "In re: Estate of Arthur Montgomery Harrington",
            "description": "Contested holographic codicil validity, testamentary capacity challenge, and petition for appointment of special administrator.",
            "case_type": "Probate",
            "status": "UNDER_REVIEW",
            "priority": "LOW",
            "filing_date": (now - timedelta(days=75)).date(),
            "courtroom": "Courtroom 1B",
            "assigned_judge": "Hon. Sarah Jenkins",
        },
        {
            "case_number": "JFP-2026-0108",
            "title": "Aegis Robotics Inc v. Titan Autonomous Systems",
            "description": "Emergency petition to seal confidential LIDAR neural network schematics and enforce non-solicitation covenants against departing executives.",
            "case_type": "Commercial",
            "status": "ASSIGNED",
            "priority": "HIGH",
            "filing_date": (now - timedelta(days=18)).date(),
            "courtroom": "Courtroom 3A",
            "assigned_judge": "Hon. Sarah Jenkins",
        },
        {
            "case_number": "JFP-2026-0109",
            "title": "Civic Freedom Coalition v. City Election Commission",
            "description": "First Amendment challenge against ballot distribution restrictions and campaign finance disclosure ordinances.",
            "case_type": "Civil",
            "status": "HEARING",
            "priority": "URGENT",
            "filing_date": (now - timedelta(days=8)).date(),
            "courtroom": "Courtroom 4B",
            "assigned_judge": "Hon. Marcus Reynolds",
        },
        {
            "case_number": "JFP-2026-0110",
            "title": "Summit Skyline Constructors v. Pinnacle Development Group",
            "description": "Confirmation of $14.2M AAA arbitration award regarding skyscraper structural foundation delays and geotechnical site variance.",
            "case_type": "Commercial",
            "status": "CLOSED",
            "priority": "LOW",
            "filing_date": (now - timedelta(days=120)).date(),
            "courtroom": "Courtroom 2B",
            "assigned_judge": "Hon. Sarah Jenkins",
        },
        {
            "case_number": "JFP-2026-0111",
            "title": "In re Marriage of Sterling and Sterling",
            "description": "High-net-worth dissolution involving offshore entity valuation and contested prenuptial agreement validity.",
            "case_type": "Family",
            "status": "UNDER_REVIEW",
            "priority": "MEDIUM",
            "filing_date": (now - timedelta(days=35)).date(),
            "courtroom": "Courtroom 1A",
            "assigned_judge": "Hon. Marcus Reynolds",
        },
    ]

    seeded_cases = {}
    for c_data in demo_cases_data:
        case = Case(**c_data)
        db.add(case)
        db.commit()
        db.refresh(case)
        seeded_cases[case.case_number] = case

    print(f"[OK] Seeded {len(seeded_cases)} cases with varied types, statuses, and judges.")

    # 4. Seed Realistic Legal Documents (for RAG Analysis)
    print("\n--- [4/6] Creating & Storing 12 Fictional Case Documents ---")

    docs_data = [
        # Case 1 Documents (Vanguard v. Pacific Grid)
        {
            "case": seeded_cases["JFP-2026-0101"],
            "filename": "Verified_Complaint_Vanguard_v_PacificGrid.txt",
            "doc_type": "Complaint",
            "desc": "Verified complaint alleging breach of Section 4.2 interconnection agreement and firmware trade secret misappropriation.",
            "content": (
                "IN THE DISTRICT COURT OF RECORD — COMMERCIAL DIVISION\n"
                "VANGUARD RENEWABLE ENERGY LLC, Plaintiff, v. PACIFIC GRID CORP, Defendant.\n"
                "Case No. JFP-2026-0101\n\n"
                "VERIFIED COMPLAINT FOR INJUNCTIVE RELIEF AND DAMAGES\n\n"
                "1. Plaintiff Vanguard Renewable Energy operates a 500-megawatt solar and battery storage facility.\n"
                "2. Under the Master Interconnection Agreement dated June 12, 2024, Defendant Pacific Grid was contractually obligated "
                "to complete substation telemetry synchronization by October 1, 2025 (Section 4.2).\n"
                "3. Defendant intentionally delayed interconnection by 14 weeks while secretly extracting proprietary battery load balancing "
                "algorithms and firmware source code (Version 4.2.1) under the pretext of safety testing.\n"
                "4. Plaintiff has suffered liquidated damages exceeding $24,500,000 and imminent loss of intellectual property exclusivity.\n"
                "5. WHEREFORE, Plaintiff moves for preliminary injunction and immediate inspection of substation telemetry records."
            ),
        },
        {
            "case": seeded_cases["JFP-2026-0101"],
            "filename": "Expert_Report_Grid_Interconnection_Forensics.txt",
            "doc_type": "Expert Report",
            "desc": "Independent forensic engineering audit confirming deliberate telemetry delay and firmware extraction.",
            "content": (
                "EXPERT FORENSIC ENGINEERING REPORT\n"
                "Prepared by: Dr. Aris Thorne, PE, Senior Grid Reliability Specialist\n"
                "Subject: Technical Audit of Substation Alpha-7 Telemetry and Vanguard BMS Firmware\n\n"
                "EXECUTIVE SUMMARY:\n"
                "1. Substation Alpha-7 was fully equipped and compliant with IEEE 1547 standards as of September 20, 2025.\n"
                "2. Pacific Grid telemetry server logs show unauthorized outbound data transfers of 42.8 GB on October 14, 2025, "
                "originating from Vanguard's battery management controller to an unencrypted engineering terminal at Pacific Grid HQ.\n"
                "3. The claimed 'thermal instability safety hold' cited by Pacific Grid was unsupported by SCADA temperature sensors, "
                "which recorded nominal operating temperatures of 21.4°C across all inverter banks.\n"
                "CONCLUSION: The interconnection delay was technically unjustified and firmware exfiltration is confirmed."
            ),
        },
        {
            "case": seeded_cases["JFP-2026-0101"],
            "filename": "Motion_for_Preliminary_Injunction.txt",
            "doc_type": "Motion",
            "desc": "Emergency motion under Rule 65 for mandatory grid synchronization and data preservation.",
            "content": (
                "MOTION FOR PRELIMINARY INJUNCTION AND EXPEDITED DISCOVERY\n"
                "Plaintiff Vanguard moves pursuant to Rule 65 for an immediate Order:\n"
                "1. Compelling Pacific Grid to energize the 500MW interconnection at Substation Alpha-7.\n"
                "2. Enjoining Pacific Grid from deploying, copying, or utilizing Vanguard BMS Algorithm Version 4.2.1.\n"
                "3. Ordering full preservation of all SCADA telemetry logs and server communication backups.\n"
                "The balance of harms heavily favors Plaintiff due to catastrophic seasonal curtailment losses."
            ),
        },
        {
            "case": seeded_cases["JFP-2026-0101"],
            "filename": "Defendant_Answer_and_Counterclaims.txt",
            "doc_type": "Answer",
            "desc": "Pacific Grid answer alleging grid safety compliance and counterclaims for harmonic distortion.",
            "content": (
                "DEFENDANT PACIFIC GRID CORP'S ANSWER AND AFFIRMATIVE DEFENSES\n"
                "1. Defendant denies all allegations of bad faith delay and trade secret misappropriation.\n"
                "2. FIRST AFFIRMATIVE DEFENSE: Interconnection holds were instituted pursuant to mandatory State Reliability Directive SR-902.\n"
                "3. SECOND AFFIRMATIVE DEFENSE: Vanguard's inverters generated excessive third-order harmonic distortion exceeding 5.2% THD.\n"
                "COUNTERCLAIM: Defendant claims $4,200,000 for emergency reactive power compensation installed at Substation Alpha-7."
            ),
        },
        # Case 2 Documents (Apex Maritime)
        {
            "case": seeded_cases["JFP-2026-0102"],
            "filename": "Coast_Guard_Marine_Inspection_Report.txt",
            "doc_type": "Inspection Report",
            "desc": "Official US Coast Guard maritime incident investigation into coastal oil spill.",
            "content": (
                "UNITED STATES COAST GUARD MARINE CASUALTY REPORT\n"
                "Vessel: M/V Pacific Osprey (IMO 9482710) | Operator: Apex Maritime Logistics Ltd\n\n"
                "FINDINGS OF FACT:\n"
                "1. On February 4, 2026 at 0214 hours, M/V Pacific Osprey discharged an estimated 1,800 gallons of heavy fuel oil in Channel Sector 4.\n"
                "2. Inspection of the oil water separator revealed physical tampering with the optical density sensor bypass valve.\n"
                "3. Bridge navigation voice recordings confirm the Second Mate was absent from the radar watch during restricted visibility transit.\n"
                "VIOLATION: Clear violation of Clean Water Act Sec 311 and COLREGS Rule 5 (Lookout Duty)."
            ),
        },
        {
            "case": seeded_cases["JFP-2026-0102"],
            "filename": "Captain_Sworn_Deposition_Excerpts.txt",
            "doc_type": "Deposition",
            "desc": "Deposition of Captain Henrik Lindqvist regarding steering failure.",
            "content": (
                "DEPOSITION OF CAPTAIN HENRIK LINDQVIST\n"
                "Q: Captain, was the automated bilge discharge valve activated while entering territorial waters?\n"
                "A: The chief engineer informed me of an emergency high-level alarm in the bilge tank. We operated under emergency protocol.\n"
                "Q: Did you inform Vessel Traffic Services (VTS) immediately?\n"
                "A: There was a 35-minute delay due to satellite communication reset in heavy fog."
            ),
        },
        # Case 3 Documents (Quantum BioPharma)
        {
            "case": seeded_cases["JFP-2026-0103"],
            "filename": "Shareholder_Derivative_Complaint.txt",
            "doc_type": "Complaint",
            "desc": "Shareholder derivative action alleging insider trading and merger price concealment.",
            "content": (
                "SHAREHOLDER DERIVATIVE ACTION FOR BREACH OF FIDUCIARY DUTIES\n"
                "1. Plaintiffs bring this action on behalf of Quantum BioPharma Inc against Sterling Ventures Corp.\n"
                "2. Defendants failed to disclose an FDA Clinical Hold letter dated November 14, 2025 regarding drug candidate QBP-401.\n"
                "3. Controlling shareholders executed stock redemption agreements at $45.00/share days before public disclosure collapsed the stock to $11.20/share."
            ),
        },
        # Case 5 Documents (Metro Transit)
        {
            "case": seeded_cases["JFP-2026-0105"],
            "filename": "Final_Environmental_Impact_Statement.txt",
            "doc_type": "Environmental Review",
            "desc": "Excerpts from state environmental impact assessment for Light Rail Phase II.",
            "content": (
                "STATE ENVIRONMENTAL REVIEW BOARD — FINAL EIS EXCERPTS\n"
                "Project: Metro Light Rail Extension Phase II\n"
                "Noise and vibration mitigation measures along the wetland corridor comply with CEQA Section 21081 standards.\n"
                "Mitigation Measure BIO-4 requires seasonal construction cessation during avian nesting (March 1 - June 15)."
            ),
        },
        # Case 6 Documents (People v. Marcus Vance)
        {
            "case": seeded_cases["JFP-2026-0106"],
            "filename": "Grand_Jury_Indictment_Marcus_Vance.txt",
            "doc_type": "Indictment",
            "desc": "Grand Jury true bill charging 14 counts of wire fraud and pension embezzlement.",
            "content": (
                "SUPERIOR COURT OF THE STATE — CRIMINAL INDICTMENT\n"
                "THE PEOPLE OF THE STATE v. MARCUS VANCE, Defendant.\n"
                "COUNT ONE: WIRE FRAUD (18 U.S.C. 1343)\n"
                "From January 2024 to November 2025, Defendant orchestrated a scheme to divert $8,400,000 from the Municipal Transit Pension Fund "
                "into offshore shell corporations under the guise of private equity capital commitments."
            ),
        },
        {
            "case": seeded_cases["JFP-2026-0106"],
            "filename": "Motion_to_Suppress_Title_III_Wiretaps.txt",
            "doc_type": "Motion",
            "desc": "Defense motion challenging legality of judicial wiretap authorization.",
            "content": (
                "DEFENDANT MARCUS VANCE'S MOTION TO SUPPRESS WIRETAP EVIDENCE\n"
                "Defendant respectfully moves to suppress all intercepted cellular communications from Target Telephone 3.\n"
                "The government failed to satisfy the statutory 'necessity requirement' under Title III (18 U.S.C. 2518(1)(c)), "
                "as standard physical surveillance and financial subpoenas were not exhausted prior to interception."
            ),
        },
        # Case 8 Documents (Aegis Robotics)
        {
            "case": seeded_cases["JFP-2026-0108"],
            "filename": "Confidential_LIDAR_Architecture_Declaration.txt",
            "doc_type": "Declaration",
            "desc": "Chief Technology Officer declaration regarding neural network LIDAR trade secrets.",
            "content": (
                "DECLARATION OF DR. ELENA ROSTOVA, CTO OF AEGIS ROBOTICS\n"
                "1. Aegis Robotics spent $38,000,000 developing the 'PulseVision' Solid-State LIDAR Neural Network Architecture.\n"
                "2. Former Director of Perception Dr. Daniel Miller downloaded 1,400 CAD schematics and source repos onto an unauthorized USB device "
                "48 hours prior to announcing his executive appointment at Titan Autonomous Systems."
            ),
        },
        # Case 9 Documents (Civic Freedom)
        {
            "case": seeded_cases["JFP-2026-0109"],
            "filename": "Emergency_First_Amendment_Injunction_Brief.txt",
            "doc_type": "Brief",
            "desc": "Plaintiff constitutional brief regarding ballot access and free speech.",
            "content": (
                "MEMORANDUM OF LAW IN SUPPORT OF EMERGENCY PRELIMINARY INJUNCTION\n"
                "The City Election Commission's 500-foot speech-free exclusion zone violates the First Amendment as an overbroad, "
                "content-discriminatory restraint on grassroots civic mobilization and signature gathering in public fora."
            ),
        },
    ]

    for d in docs_data:
        file_name = d["filename"]
        file_path_disk = UPLOADS_DIR / file_name
        file_path_disk.write_text(d["content"], encoding="utf-8")

        relative_path = f"uploads/documents/{file_name}"
        doc_record = Document(
            case_id=d["case"].id,
            filename=file_name,
            file_path=relative_path,
            document_type=d["doc_type"],
            file_size=len(d["content"]),
            mime_type="text/plain",
            description=d["desc"],
            uploaded_by=admin.id,
        )
        db.add(doc_record)

    db.commit()
    print(f"[OK] Seeded {len(docs_data)} authentic legal filings across key cases.")

    # 5. Seed 9 Realistic Court Hearings
    print("\n--- [5/6] Scheduling 9 Court Hearings ---")
    hearings_data = [
        {
            "case": seeded_cases["JFP-2026-0101"],
            "type": "Preliminary Injunction Hearing",
            "scheduled_at": now + timedelta(days=1, hours=2),
            "location": "Courtroom 3A",
            "judge": "Hon. Sarah Jenkins",
            "status": "CONFIRMED",
            "notes": "Emergency Rule 65 hearing on grid synchronization and data preservation. 2 hours allotted for expert testimony.",
        },
        {
            "case": seeded_cases["JFP-2026-0106"],
            "type": "Bail Review & Suppression Hearing",
            "scheduled_at": now + timedelta(days=1, hours=1),
            "location": "Courtroom 5B",
            "judge": "Hon. Marcus Reynolds",
            "status": "CONFIRMED",
            "notes": "Oral argument on Title III wiretap suppression and $2.5M bond conditions.",
        },
        {
            "case": seeded_cases["JFP-2026-0105"],
            "type": "Final Decision Delivery Conference",
            "scheduled_at": now + timedelta(days=2, hours=4),
            "location": "Courtroom 2A",
            "judge": "Hon. Sarah Jenkins",
            "status": "SCHEDULED",
            "notes": "Delivery of administrative ruling on Light Rail Phase II environmental impact review.",
        },
        {
            "case": seeded_cases["JFP-2026-0109"],
            "type": "Emergency Constitutional Motion Hearing",
            "scheduled_at": now + timedelta(days=2, hours=6),
            "location": "Courtroom 4B",
            "judge": "Hon. Marcus Reynolds",
            "status": "SCHEDULED",
            "notes": "First Amendment challenge on ballot distribution radius restrictions.",
        },
        {
            "case": seeded_cases["JFP-2026-0102"],
            "type": "Admiralty Motion in Limine Hearing",
            "scheduled_at": now + timedelta(days=4, hours=3),
            "location": "Courtroom 2B",
            "judge": "Hon. Marcus Reynolds",
            "status": "SCHEDULED",
            "notes": "Evidentiary hearing on Coast Guard radar logs and bilge valve inspection findings.",
        },
        {
            "case": seeded_cases["JFP-2026-0111"],
            "type": "Financial Disclosure & Conciliation",
            "scheduled_at": now + timedelta(days=6, hours=1),
            "location": "Courtroom 1A",
            "judge": "Hon. Marcus Reynolds",
            "status": "SCHEDULED",
            "notes": "Review of forensic accounting disclosures and offshore valuation disputes.",
        },
        {
            "case": seeded_cases["JFP-2026-0103"],
            "type": "Motion to Dismiss Hearing",
            "scheduled_at": now + timedelta(days=8, hours=2),
            "location": "Courtroom 4A",
            "judge": "Hon. Sarah Jenkins",
            "status": "SCHEDULED",
            "notes": "Defendant motion to dismiss shareholder derivative complaint based on Special Litigation Committee report.",
        },
        {
            "case": seeded_cases["JFP-2026-0107"],
            "type": "Probate Accounting Review",
            "scheduled_at": now + timedelta(days=12, hours=1),
            "location": "Courtroom 1B",
            "judge": "Hon. Sarah Jenkins",
            "status": "SCHEDULED",
            "notes": "Annual accounting submission and petition for special administrator bond.",
        },
        {
            "case": seeded_cases["JFP-2026-0110"],
            "type": "Arbitration Award Confirmation",
            "scheduled_at": now - timedelta(days=10),
            "location": "Courtroom 2B",
            "judge": "Hon. Sarah Jenkins",
            "status": "COMPLETED",
            "notes": "Final order entered confirming $14.2M AAA construction arbitration award. Case concluded.",
            "outcome": "Judgment entered in full for Plaintiff.",
        },
    ]

    for h in hearings_data:
        hearing = Hearing(
            case_id=h["case"].id,
            hearing_type=h["type"],
            scheduled_at=h["scheduled_at"],
            location=h["location"],
            judge=h["judge"],
            status=h["status"],
            notes=h["notes"],
            outcome=h.get("outcome"),
        )
        db.add(hearing)

    db.commit()
    print(f"[OK] Scheduled {len(hearings_data)} docketed hearings across courtrooms 1A through 5B.")

    # 6. Seed 10 Realistic Tasks & Action Items
    print("\n--- [6/6] Assigning 10 Judicial Tasks & 20 Notifications ---")
    tasks_data = [
        {
            "case": seeded_cases["JFP-2026-0101"],
            "assigned_to": admin.id,
            "title": "Review Expert Telemetry Forensics Brief",
            "desc": "Examine Dr. Thorne's telemetry data audit regarding Substation Alpha-7 prior to tomorrow's Rule 65 hearing.",
            "priority": "URGENT",
            "status": "PENDING",
            "due_date": now + timedelta(days=1),
        },
        {
            "case": seeded_cases["JFP-2026-0106"],
            "assigned_to": judge_marcus.id,
            "title": "Review Title III Wiretap Affidavit Authorization",
            "desc": "Examine government's necessity showing in light of Vance motion to suppress wiretap intercepts.",
            "priority": "URGENT",
            "status": "IN_PROGRESS",
            "due_date": now + timedelta(days=1),
        },
        {
            "case": seeded_cases["JFP-2026-0101"],
            "assigned_to": judge_sarah.id,
            "title": "Draft Preliminary Injunction Order",
            "desc": "Prepare draft Rule 65 order regarding 500MW grid energization and trade secret protective provisions.",
            "priority": "HIGH",
            "status": "PENDING",
            "due_date": now + timedelta(days=3),
        },
        {
            "case": seeded_cases["JFP-2026-0102"],
            "assigned_to": admin.id,
            "title": "Inspect Coast Guard Admiralty Radar Logs",
            "desc": "Cross-reference VTS channel recordings against Captain Lindqvist deposition statements.",
            "priority": "HIGH",
            "status": "IN_PROGRESS",
            "due_date": now + timedelta(days=2),
        },
        {
            "case": seeded_cases["JFP-2026-0108"],
            "assigned_to": judge_sarah.id,
            "title": "Issue Protective Order for LIDAR Neural Net Schematics",
            "desc": "Review Aegis Robotics emergency motion to seal proprietary source code and CAD files.",
            "priority": "HIGH",
            "status": "PENDING",
            "due_date": now + timedelta(days=4),
        },
        {
            "case": seeded_cases["JFP-2026-0103"],
            "assigned_to": admin.id,
            "title": "Analyze Special Litigation Committee Report",
            "desc": "Evaluate independence criteria of Sterling Ventures committee prior to motion to dismiss.",
            "priority": "MEDIUM",
            "status": "PENDING",
            "due_date": now + timedelta(days=6),
        },
        {
            "case": seeded_cases["JFP-2026-0104"],
            "assigned_to": judge_marcus.id,
            "title": "Issue Pretrial Scheduling Order",
            "desc": "Enter standard antitrust discovery timeline and electronic evidence exchange protocols.",
            "priority": "MEDIUM",
            "status": "PENDING",
            "due_date": now + timedelta(days=5),
        },
        {
            "case": seeded_cases["JFP-2026-0105"],
            "assigned_to": judge_sarah.id,
            "title": "Finalize Light Rail Phase II Ruling",
            "desc": "Incorporate CEQA Section 21081 findings and sign final administrative order.",
            "priority": "HIGH",
            "status": "COMPLETED",
            "due_date": now - timedelta(days=1),
        },
        {
            "case": seeded_cases["JFP-2026-0107"],
            "assigned_to": admin.id,
            "title": "Audit Harrington Estate Annual Filings",
            "desc": "Review fiduciary accounting statements and bond coverage limits.",
            "priority": "LOW",
            "status": "PENDING",
            "due_date": now + timedelta(days=10),
        },
        {
            "case": seeded_cases["JFP-2026-0110"],
            "assigned_to": judge_sarah.id,
            "title": "Archive Completed Skyscraper Arbitration Record",
            "desc": "Transmit final confirmation decree to county recorder and close file.",
            "priority": "LOW",
            "status": "COMPLETED",
            "due_date": now - timedelta(days=8),
        },
    ]

    for t in tasks_data:
        task = Task(
            title=t["title"],
            description=t["desc"],
            case_id=t["case"].id,
            assigned_to=t["assigned_to"],
            priority=t["priority"],
            status=t["status"],
            due_date=t["due_date"],
        )
        db.add(task)

    db.commit()
    print(f"[OK] Assigned {len(tasks_data)} judicial tasks with active and completed statuses.")

    # 7. Seed 20 Contextual Notifications
    notifications_data = [
        {
            "user_id": admin.id,
            "title": "URGENT Action Required: Vanguard v. Pacific Grid",
            "message": "Emergency Rule 65 Injunction Hearing scheduled for tomorrow at 10:00 AM in Courtroom 3A.",
            "type": "HEARING_SCHEDULED",
            "priority": "URGENT",
            "link": "/hearings",
            "is_read": False,
            "created_at": now - timedelta(minutes=12),
        },
        {
            "user_id": admin.id,
            "title": "Action Item Assigned: Review Telemetry Forensics",
            "message": "You were assigned task 'Review Expert Telemetry Forensics Brief' on Case JFP-2026-0101.",
            "type": "TASK_ASSIGNED",
            "priority": "URGENT",
            "link": "/tasks",
            "is_read": False,
            "created_at": now - timedelta(minutes=25),
        },
        {
            "user_id": admin.id,
            "title": "Criminal Docket Alert: People v. Vance",
            "message": "Bail Review & Wiretap Suppression Hearing confirmed for tomorrow at 09:00 AM in Courtroom 5B.",
            "type": "HEARING_SCHEDULED",
            "priority": "URGENT",
            "link": "/hearings",
            "is_read": False,
            "created_at": now - timedelta(hours=1),
        },
        {
            "user_id": admin.id,
            "title": "New Evidence Uploaded: M/V Pacific Osprey",
            "message": "Coast Guard Marine Inspection Report was submitted in Case JFP-2026-0102.",
            "type": "DOCUMENT_UPLOADED",
            "priority": "INFO",
            "link": "/documents",
            "is_read": False,
            "created_at": now - timedelta(hours=2),
        },
        {
            "user_id": admin.id,
            "title": "Emergency Filing: Aegis Robotics v. Titan",
            "message": "Emergency petition filed to seal confidential LIDAR neural network schematics in JFP-2026-0108.",
            "type": "CASE_ALERT",
            "priority": "WARNING",
            "link": "/cases",
            "is_read": False,
            "created_at": now - timedelta(hours=3),
        },
        {
            "user_id": admin.id,
            "title": "First Amendment Injunction: Civic Freedom",
            "message": "Emergency Constitutional Motion Hearing docketed in Courtroom 4B for Oct 3.",
            "type": "HEARING_SCHEDULED",
            "priority": "WARNING",
            "link": "/hearings",
            "is_read": True,
            "created_at": now - timedelta(hours=5),
        },
        {
            "user_id": admin.id,
            "title": "Case Status Update: Metro Transit Alliance",
            "message": "Case JFP-2026-0105 status transitioned from HEARING to DECISION.",
            "type": "CASE_ALERT",
            "priority": "INFO",
            "link": "/cases",
            "is_read": True,
            "created_at": now - timedelta(hours=8),
        },
        {
            "user_id": admin.id,
            "title": "New Case Filed: CloudStack v. HyperScale",
            "message": "New civil antitrust litigation docketed under Case No. JFP-2026-0104.",
            "type": "CASE_ALERT",
            "priority": "INFO",
            "link": "/cases",
            "is_read": True,
            "created_at": now - timedelta(days=1),
        },
        {
            "user_id": admin.id,
            "title": "Hearing Completed: Pinnacle Skyline Arbitration",
            "message": "Final confirmation order entered for $14.2M award in JFP-2026-0110. Case closed.",
            "type": "CASE_ALERT",
            "priority": "SUCCESS",
            "link": "/cases",
            "is_read": True,
            "created_at": now - timedelta(days=2),
        },
        # Judge Sarah Notifications
        {
            "user_id": judge_sarah.id,
            "title": "Chamber Calendar: Vanguard v. Pacific Grid Hearing",
            "message": "Presiding over Rule 65 Injunction Hearing tomorrow at 10:00 AM in Courtroom 3A.",
            "type": "HEARING_SCHEDULED",
            "priority": "URGENT",
            "link": "/hearings",
            "is_read": False,
            "created_at": now - timedelta(minutes=15),
        },
        {
            "user_id": judge_sarah.id,
            "title": "Judicial Action Item: Draft Injunction Order",
            "message": "Task assigned to draft preliminary injunction order on 500MW solar grid connection.",
            "type": "TASK_ASSIGNED",
            "priority": "HIGH",
            "link": "/tasks",
            "is_read": False,
            "created_at": now - timedelta(hours=1),
        },
        {
            "user_id": judge_sarah.id,
            "title": "Decision Ready: Metro Transit Light Rail Review",
            "message": "Final administrative decision conference scheduled for tomorrow at 03:30 PM.",
            "type": "HEARING_SCHEDULED",
            "priority": "INFO",
            "link": "/hearings",
            "is_read": True,
            "created_at": now - timedelta(hours=6),
        },
        # Judge Marcus Notifications
        {
            "user_id": judge_marcus.id,
            "title": "Criminal Docket Alert: People v. Vance",
            "message": "Presiding over Bail Review and Wiretap Suppression Hearing tomorrow at 09:00 AM in Courtroom 5B.",
            "type": "HEARING_SCHEDULED",
            "priority": "URGENT",
            "link": "/hearings",
            "is_read": False,
            "created_at": now - timedelta(minutes=20),
        },
        {
            "user_id": judge_marcus.id,
            "title": "Urgent Review: Title III Suppression Motion",
            "message": "Defense motion to suppress wiretap evidence requires judicial determination.",
            "type": "TASK_ASSIGNED",
            "priority": "URGENT",
            "link": "/tasks",
            "is_read": False,
            "created_at": now - timedelta(hours=2),
        },
        {
            "user_id": judge_marcus.id,
            "title": "Admiralty Hearing Scheduled: Apex Maritime",
            "message": "Admiralty Motion in Limine Hearing docketed in Courtroom 2B.",
            "type": "HEARING_SCHEDULED",
            "priority": "WARNING",
            "link": "/hearings",
            "is_read": True,
            "created_at": now - timedelta(hours=12),
        },
    ]

    for n in notifications_data:
        notif = Notification(
            user_id=n["user_id"],
            title=n["title"],
            message=n["message"],
            type=n["type"],
            priority=n["priority"],
            link=n["link"],
            is_read=n["is_read"],
            created_at=n["created_at"],
        )
        db.add(notif)

    db.commit()
    print(f"[OK] Generated {len(notifications_data)} contextual notifications across Admin and Judicial Chambers.")

    # 8. Run RAG Vector Indexing
    print("\n--- [7/7] Ingesting & Indexing All Documents into RAG Vector Store ---")
    index_stats = index_all_documents(db)
    print(f"[OK] Vector Store synced: {index_stats['indexed_documents']} documents ingested, {index_stats['total_chunks']} vector chunks indexed.")

    db.close()
    print("\n================================================================================")
    print("      DEMO DATASET SEEDING COMPLETED SUCCESSFULLY — READY FOR PRESENTATION       ")
    print("================================================================================")


if __name__ == "__main__":
    seed_demo_data()
