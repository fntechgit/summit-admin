import React, {useState} from "react";
import PropTypes from "prop-types";

import styles from "./index.module.less";

const Card = ({presentation, sortable, index, isAlternate, onCardClick, onRemove}) => {
    const [remove, setRemove] = useState(false);

    const preRemove = e => {
        e.preventDefault();
        setRemove(true);
    };

    const handleRemove = e => {
        e.preventDefault();
        onRemove(presentation.id);
        setRemove(false);
    };

    const removeBlock = () => {
        if (!remove)
            return (
                <a href="#" className={styles.trash} onClick={preRemove}>
                    <i className="fa fa-trash"/>
                </a>
            );

        return (
            <div className={styles.confirm}>
                <a href="#" className={styles.yes} onClick={handleRemove}>
                    <i className="fa fa-check"/>
                </a>
                <span>Remove?</span>
                <a href="#" className={styles.no} onClick={() => {setRemove(false)}}>
                    <i className="fa fa-times"/>
                </a>
            </div>
        );
    };

    const displayRank = isAlternate? "ALT" : `# ${index + 1}`;

    return (
      <div className={`${styles.wrapper} ${sortable ? styles.sortable : ""}`}>
          <div className={styles.header}>
              {sortable && <div className={styles.rank}>{displayRank}</div>}
              {sortable &&
                <div className={styles.actions}>
                    <span>DRAG</span>
                </div>
              }
              <div className={styles.level}>{presentation.level}</div>
          </div>
          <div className={styles.body}>
              <div className={styles.title} onClick={() => onCardClick(presentation)}>
                  {presentation.id} - {presentation.title}
              </div>
          </div>
          <div className={styles.footer}>
              {sortable &&
                <div className={styles.remove}>
                    {removeBlock()}
                </div>
              }
          </div>
      </div>
    );
}

Card.propTypes = {
  presentation: PropTypes.object.isRequired,
  sortable: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
  isAlternate: PropTypes.bool.isRequired,
  onCardClick: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default Card;