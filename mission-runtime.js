'use strict';

// Final runtime selector for BrightKin Standalone Joy Mission Engine v3.
// Uses exactly one core activity per mission and never calls composite/mash-up builders.
localMissionSet = function brightKinStandaloneMissionSet(form, count, alreadyCreated = []) {
  const ids = form.people.length ? form.people : state.members.slice(0, 2).map(m => m.id);
  const feeling = normalizedFeeling(form.feeling);
  const bank = freshCoreBank(feeling);
  const created = [];
  const target = Math.max(0, Number(count) || 0);

  for (let outputIndex = 0; outputIndex < target; outputIndex++) {
    const history = freshMissionHistory(feeling, [...(alreadyCreated || []), ...created]);
    const recentCoreIds = new Set(
      history.slice(0, Math.max(0, bank.length - 1)).map(m => m.coreId).filter(Boolean)
    );
    const useCounts = new Map(bank.map(core => [core.id, history.filter(m => m.coreId === core.id).length]));
    const categorySequence = history.filter(m => m.source === 'local-standalone-v3').length;

    let eligible = bank
      .map((core, index) => ({ core, index, uses: useCounts.get(core.id) || 0 }))
      .filter(x => !recentCoreIds.has(x.core.id) && !created.some(m => m.coreId === x.core.id));

    if (!eligible.length) {
      eligible = bank
        .map((core, index) => ({ core, index, uses: useCounts.get(core.id) || 0 }))
        .filter(x => !created.some(m => m.coreId === x.core.id));
    }

    const minUses = Math.min(...eligible.map(x => x.uses));
    const leastUsed = eligible.filter(x => x.uses === minUses);
    const pick = leastUsed[categorySequence % leastUsed.length];
    const priorUses = pick.uses;
    const edition = freshEditions[priorUses % freshEditions.length];
    const focusRound = Math.floor(priorUses / freshEditions.length);
    const focus = freshFocuses[(pick.index + focusRound + categorySequence) % freshFocuses.length];
    const serial = (history.length + 1) * 100000 + pick.index * 1000 + priorUses * 10 + outputIndex;

    const mission = buildFreshStandaloneMission(
      form,
      ids,
      pick.core,
      edition,
      focus,
      serial,
      priorUses,
      pick.index
    );

    if (priorUses > 0) {
      const focusSuffix = focusRound > 0 ? ` · ${titleInterest(focus)}` : '';
      mission.title = clip(`${pick.core.title} — ${edition.label}${focusSuffix}`, 92);
    } else {
      mission.title = pick.core.title;
    }

    mission.variantKey = `standalone-v3:${feeling}:${pick.core.id}:${edition.id}:${focusRound}:${serial}`;
    mission.activityId = `standalone:${feeling}:${pick.core.id}:${edition.id}:${focusRound}:${serial}`;
    mission.coreId = pick.core.id;
    mission.editionId = edition.id;
    mission.source = 'local-standalone-v3';
    mission.engineVersion = FRESH_MISSION_ENGINE_VERSION;

    // Defensive exact-duplicate guard. If a very old title eventually recurs, add the focus label
    // while keeping the mission a single standalone activity.
    const allTitles = new Set(history.map(m => cleanText(m.title).toLowerCase()));
    if (allTitles.has(cleanText(mission.title).toLowerCase())) {
      mission.title = clip(`${pick.core.title} — ${edition.label} · ${titleInterest(focus)}`, 92);
    }

    created.push(mission);
  }

  return created;
};
