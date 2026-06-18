---
title: "Distilling Frontier Tool-Calling Into a Local 8B"
date: "June 17, 2026"
description: "A frontier model's agentic tool-calling, distilled into an 8B that runs free on a single GPU. The untrained base reasons but reaches for no tools; the distilled student runs the full market-analyst plan — locally, $0 a call, no egress."
---

```
                                               =
                                              .+..-: .
                                              +█#++&▒░
                                             -%&██▓█@..
                                             -░&@▒▒#&&#            ..
                               .::..         +░██░░▒██▓=        .. -:. :
                             .&#%-=%&%      .▒▓██████@+▓.       +▒@*=&▒▓
                            :@*@▓▓▒░%-      =▓+██████--█-        -&▓██░+
                     .       ***███▒++      *▓:#████▓.+░=       %&&░▓░#&=
                 .   =       =▓░#&#░▓▓      *▒=.█#-█▒.:.        #█▒▓@▓█░@   = .=**
                .*  .=       ░████████=     .-.%█@-░▓%&░=      :█▓███████- -*:=##%=
                #▒*-*@%&:   =▒%█████▒%░      ::#@@&&#*.        &█+█████▒█= -#▓@#▒▓▒=
              -+▒████▓=▓-   %#*█████&-█:        .-:.           ▒# #░▓█▒&▒...:█▓███##
          :. -█▒&@▓▓#&%░-   &░.&█&▒▒ =%*                       .. @▓ #▓▓* :▒&&&#@@▒█*
          #▓*&███▓%#▒#▒█=   .. ░▓ ▓▓-.                          .:▒█=*█=  =@░▒░▒██░▒*
          #█▒█▓#████████@: .+.*█▓=%#░▒+                       .%░░%=:&█▒. #█████████+
          &████░@███████▓░  -+=-+&::..                          .:-=&%=.-:░*▓███████#
          +█████▒░█▓▓███▒*     .:.                 ..               ..-. =#=░██████▓&
          :▓████▓▓█▒████@*:                        -.        --.--=         &█▒▓██+█*
         .-░█████████▒█▓█▓█#.   . +-         ..    =:        %█▒░▓▒       :=░█▓:#█=%=
         .=&#▓██████▒▓▓▒░*-     *@&=#▒:      -▓@%=&▓░        .%██▒:     .:%+&%==▓█▒==.
 -░&-.      .-%░▒███▓#+.        :&█▒▓=        :@▓█▒%:        %@#▒@#       .-.:&%▓▓@%=.        .=&░:
  .=&░@*:       .+=-.           -@▒░#&:      #+&░▓▓%*        %████▓*         .-*-.         :*@░&=.
      :*@░&=.                  -░▓██▒█&     *█▓█░&▓▒@.       &████░█:                  .+&░@*:
         .=%░@%-.              ++▓███░*    =░=███████%       ▒%█%█**-              .-%@@%-.
             .+#▒#+.          .=-░▒&▓▒-.   ░% ▓█████*█:     .=@▓.▓&-.           .+#░#+.
                .-%@░%=.      .=%@&=:+=.  -░% @████▒=█:    .*=░▒&█▒*=       .=%░@*-
                    .=&░@*:       ..      :.. ░▓-=▒░%░:       .+*=.      :*@░&=.
                        :*@░&=.            .*#█▓░-▒█&*:              .+#░#*:
                           .-%░░%-          :+&-:+█▓=+.           -%░░%-
                               :+#░#+:          :=-.          :*#░&+.
                                   -%░░%-.                .=&░@*:
                                      .+&░@*:          -*@░&=.
                                          :*@░&=.  .+#░#+:
                                             .=&░@░@%-.
                                                 :.
```

*A frontier model knows how to drive an analyst's tools — pull prices, pick the right indicators, verify the numbers, then write. The behaviour is the valuable part, and behaviour moves. So I moved it into an 8B that runs free, on one GPU in the rack.*

---

You rarely need the largest model money can rent. For a narrow, repeatable, *agentic* task — where the real work is deciding which tools to call, and in what order — you need the behaviour, not the half-trillion-parameter host it happens to live on. Behaviour, it turns out, you can distil.

## The task

A market-analyst, in the style of the TradingAgents tool tier. A ticker and a date go in; the model pulls the price history, selects up to eight technical indicators that complement rather than echo one another, takes a deterministic *verified snapshot* to ground the figures it is about to cite, and only then writes. The prose is the easy part — every model writes paragraphs. The discipline is the skill: which tools, in what order, and the restraint to verify before it asserts. Frontier models have it; raw open-source models do not.

## The move

Capture the teacher's ReAct traces — its exact tool calls, turn by turn — and fine-tune a **Qwen3-8B** with QLoRA on that policy, supervising only the assistant's tool-call turns. The whole run fits on one **RTX 4070, 12 GB**: a 4-bit base, a small LoRA adapter, a few minutes a pass. It ships as a GGUF, applied over the stock base in Ollama. Nothing memorised — only the sequence of decisions learned.

## What it bought

Per single decision, scored against the teacher, the untrained base picked the right tool **49%** of the time; the distilled student, **90%**. The screenshot makes the point more plainly than the number.

<img src="/assets/distill/results.png" alt="Three-column demo on one ticker: untrained baseline, distilled student, and frontier teacher running the market-analyst task" style="width:100%;border:1px solid #c8c4ba;border-radius:4px;margin:12px 0;">

> One run, ticker **AAPL**. **Baseline** — the untrained Qwen3-8B — reaches for no tools: it writes 3,800 characters of *reasoning* about which indicators it might pick, then stops, having done nothing. **Student** — the same 8B plus our LoRA — runs the full plan: `get_stock_data`, eight `get_indicators`, the verified snapshot, then a report — in ~43 seconds, at **$0**, with nothing leaving the machine. **Teacher** — the frontier model, remote — produces the same shape for a few cents. The student even takes the verified snapshot the teacher skipped.

The contrast is the whole argument. The same model, untouched, thinks and never acts. The trained one runs the agentic plan end to end — structurally indistinguishable from the frontier, and on a good run more thorough than it — locally, at zero cost per call, with nothing off the box. The column that throttles and stalls is the teacher, on its remote free tier. The small model on the desk is the reliable one.

## The honest part

Base habits are stubborn. Qwen3 wanted to batch its eight indicators into one call and to invent its own parameter names; distillation pulled it most of the way, and a small serving-side normaliser handles the residue. The per-decision score flatters it a little against the full multi-turn loop, where errors compound, and another pass is queued to clean the raw output. None of it moves the headline: a ~3 GB adapter turns a model that *won't* drive tools into one that runs the whole workflow. Distil the behaviour once; run it forever, on hardware you own.
