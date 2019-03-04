step() {
    printf "\n>\033[1;33m %s...\033[0m\n" "$1"
}

success() {
    output="$1"
    message="${2:-Done}"

    printf "\033[0;32m"

    if [ -n "$VERBOSE" ] && [ -n "$output" ]; then
        printf "\n\u2714 %s. Output:\n\n" "$message"
    else
        printf "\n\u2714 %s\n" "$message"
    fi

    printf "\033[0m"

    if [ -n "$VERBOSE" ] && [ -n "$output" ]; then
        printf "%s\n" "$output"
    fi
}

error() {
    output="$1"
    message="${2:-Failed}"

    printf "\033[0;31m"

    if [ -n "$output" ]; then
        printf "\n\u2716 %s. Output:\n\n" "$message"
    else
        printf "\n\u2716 %s\n" "$message"
    fi

    printf "\033[0m"

    if  [ -n "$output" ]; then
        printf "%s\n" "$output"
    fi
}

execute() {
    command="$*"
    printf "\n%s\n" "$command"
    buffer="$(mktemp)"

    if eval "$command" > "$buffer" 2>&1; then
        output="$(cat "$buffer")"
        success "$output"
    else
        output="$(cat "$buffer")"
        error "$output"
    fi

    rm "$buffer"
}
